from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./interntrack.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

task_assignees = Table(
    "task_assignees", Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id")),
    Column("user_id", Integer, ForeignKey("users.id"))
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), nullable=False)  # manager | mentor | intern
    department = Column(String(50), nullable=False)
    avatar = Column(String(10), nullable=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    mentor = relationship("User", remote_side=[id], foreign_keys=[mentor_id])
    assigned_tasks = relationship("Task", secondary=task_assignees, back_populates="assignees")
    mentored_tasks = relationship("Task", back_populates="mentor", foreign_keys="Task.mentor_id")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    department = Column(String(50), nullable=False)
    status = Column(String(30), default="todo")  # todo | in-progress | in-review | done | blocked
    priority = Column(String(10), default="medium")  # low | medium | high
    due_date = Column(String(20), nullable=True)
    requirements = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    progress = Column(Integer, default=0)
    is_group = Column(Boolean, default=False)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    mentor = relationship("User", back_populates="mentored_tasks", foreign_keys=[mentor_id])
    assignees = relationship("User", secondary=task_assignees, back_populates="assigned_tasks")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task")
    user = relationship("User")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
