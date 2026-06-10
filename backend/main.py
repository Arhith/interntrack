from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os

from models import Base, User, Task, Comment, engine, get_db
from auth import hash_password, verify_password, create_token, get_current_user, require_role
from seed import seed

# Init DB + seed
Base.metadata.create_all(bind=engine)
seed()

app = FastAPI(title="InternTrack API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: str
    avatar: Optional[str]
    mentor_id: Optional[int]
    class Config: from_attributes = True

class TaskAssigneeOut(BaseModel):
    id: int
    name: str
    avatar: Optional[str]
    department: str
    class Config: from_attributes = True

class TaskOut(BaseModel):
    id: int
    title: str
    department: str
    status: str
    priority: str
    due_date: Optional[str]
    requirements: Optional[str]
    notes: Optional[str]
    progress: int
    is_group: bool
    mentor_id: Optional[int]
    assignees: List[TaskAssigneeOut]
    created_at: datetime
    class Config: from_attributes = True

class CommentOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    user: TaskAssigneeOut
    class Config: from_attributes = True

class TaskCreate(BaseModel):
    title: str
    department: str
    priority: str = "medium"
    due_date: Optional[str] = None
    requirements: Optional[str] = None
    notes: Optional[str] = None
    assignee_ids: List[int]

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[int] = None
    notes: Optional[str] = None

class CommentCreate(BaseModel):
    content: str

class RegisterUser(BaseModel):
    name: str
    email: str
    password: str
    role: str
    department: str
    mentor_id: Optional[int] = None

# ─── Auth Routes ─────────────────────────────────────────────────────────────

@app.post("/api/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    token = create_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user.id, "name": user.name, "email": user.email,
                     "role": user.role, "department": user.department, "avatar": user.avatar}}

@app.get("/api/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

# ─── Users Routes ────────────────────────────────────────────────────────────

@app.get("/api/users", response_model=List[UserOut])
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "manager":
        return db.query(User).all()
    elif current_user.role == "mentor":
        # Mentors see themselves, their interns, and other mentors/manager
        return db.query(User).filter(
            (User.mentor_id == current_user.id) |
            (User.role.in_(["mentor", "manager"])) |
            (User.id == current_user.id)
        ).all()
    else:
        return db.query(User).filter(User.id != None).all()

@app.post("/api/users", response_model=UserOut)
def create_user(data: RegisterUser, current_user: User = Depends(require_role("manager")), db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=data.name, email=data.email,
                hashed_password=hash_password(data.password),
                role=data.role, department=data.department,
                avatar="".join(w[0].upper() for w in data.name.split()[:2]),
                mentor_id=data.mentor_id)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.get("/api/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ─── Tasks Routes ─────────────────────────────────────────────────────────────

@app.get("/api/tasks", response_model=List[TaskOut])
def list_tasks(department: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Task)
    if current_user.role == "intern":
        task_ids = [t.id for t in current_user.assigned_tasks]
        q = q.filter(Task.id.in_(task_ids))
    elif current_user.role == "mentor":
        q = q.filter(Task.mentor_id == current_user.id)
    if department:
        q = q.filter(Task.department == department)
    return q.order_by(Task.created_at.desc()).all()

@app.post("/api/tasks", response_model=TaskOut)
def create_task(data: TaskCreate, current_user: User = Depends(require_role("mentor", "manager")), db: Session = Depends(get_db)):
    assignees = db.query(User).filter(User.id.in_(data.assignee_ids)).all()
    if not assignees:
        raise HTTPException(status_code=400, detail="No valid assignees")
    task = Task(
        title=data.title, department=data.department,
        priority=data.priority, due_date=data.due_date,
        requirements=data.requirements, notes=data.notes,
        is_group=len(assignees) > 1,
        mentor_id=current_user.id if current_user.role == "mentor" else None,
        assignees=assignees
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@app.get("/api/tasks/{task_id}", response_model=TaskOut)
def get_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.patch("/api/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: int, data: TaskUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    # Interns can only update progress; mentors/managers can update status too
    if current_user.role == "intern" and data.status:
        raise HTTPException(status_code=403, detail="Interns cannot change task status")
    if data.status:
        task.status = data.status
        if data.status == "done":
            task.progress = 100
    if data.progress is not None:
        task.progress = data.progress
    if data.notes:
        task.notes = data.notes
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task

# ─── Comments ────────────────────────────────────────────────────────────────

@app.get("/api/tasks/{task_id}/comments", response_model=List[CommentOut])
def get_comments(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Comment).filter(Comment.task_id == task_id).order_by(Comment.created_at).all()

@app.post("/api/tasks/{task_id}/comments", response_model=CommentOut)
def add_comment(task_id: int, data: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    comment = Comment(task_id=task_id, user_id=current_user.id, content=data.content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

# ─── Dashboard / Reports ─────────────────────────────────────────────────────

@app.get("/api/dashboard")
def dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "manager":
        tasks = db.query(Task).all()
        interns = db.query(User).filter(User.role == "intern").all()
        from collections import Counter
        dept_stats = {}
        for t in tasks:
            if t.department not in dept_stats:
                dept_stats[t.department] = {"total": 0, "done": 0}
            dept_stats[t.department]["total"] += 1
            if t.status == "done":
                dept_stats[t.department]["done"] += 1
        return {
            "total_tasks": len(tasks),
            "done": sum(1 for t in tasks if t.status == "done"),
            "blocked": sum(1 for t in tasks if t.status == "blocked"),
            "in_progress": sum(1 for t in tasks if t.status == "in-progress"),
            "avg_progress": round(sum(i.assigned_tasks and sum(t.progress for t in i.assigned_tasks) / len(i.assigned_tasks) if i.assigned_tasks else 0 for i in interns) / max(len(interns), 1)),
            "dept_stats": dept_stats,
            "intern_count": len(interns),
        }
    elif current_user.role == "mentor":
        tasks = db.query(Task).filter(Task.mentor_id == current_user.id).all()
        interns = db.query(User).filter(User.mentor_id == current_user.id).all()
        return {
            "total_tasks": len(tasks),
            "done": sum(1 for t in tasks if t.status == "done"),
            "in_progress": sum(1 for t in tasks if t.status == "in-progress"),
            "blocked": sum(1 for t in tasks if t.status == "blocked"),
            "intern_count": len(interns),
        }
    else:
        tasks = current_user.assigned_tasks
        return {
            "total_tasks": len(tasks),
            "done": sum(1 for t in tasks if t.status == "done"),
            "in_progress": sum(1 for t in tasks if t.status == "in-progress"),
            "group_tasks": sum(1 for t in tasks if t.is_group),
            "overall_progress": round(sum(t.progress for t in tasks) / max(len(tasks), 1)),
        }

@app.get("/api/report/weekly")
def weekly_report(current_user: User = Depends(require_role("manager", "mentor")), db: Session = Depends(get_db)):
    if current_user.role == "manager":
        interns = db.query(User).filter(User.role == "intern").all()
    else:
        interns = db.query(User).filter(User.mentor_id == current_user.id).all()

    report = []
    for intern in interns:
        tasks = intern.assigned_tasks
        mentor = db.query(User).filter(User.id == intern.mentor_id).first()
        report.append({
            "intern": {"id": intern.id, "name": intern.name, "department": intern.department, "avatar": intern.avatar},
            "mentor": mentor.name if mentor else "—",
            "total_tasks": len(tasks),
            "done": sum(1 for t in tasks if t.status == "done"),
            "in_progress": sum(1 for t in tasks if t.status == "in-progress"),
            "blocked": sum(1 for t in tasks if t.status == "blocked"),
            "blocked_tasks": [t.title for t in tasks if t.status == "blocked"],
            "avg_progress": round(sum(t.progress for t in tasks) / max(len(tasks), 1)),
        })
    return {"generated_at": datetime.utcnow().isoformat(), "data": report}

# ─── Serve React frontend ─────────────────────────────────────────────────────

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        index = os.path.join(static_dir, "index.html")
        if os.path.exists(index):
            return FileResponse(index)
        return {"detail": "Frontend not built yet"}
