from models import Base, User, Task, engine, SessionLocal
from auth import hash_password

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(User).count() > 0:
        print("Already seeded, skipping.")
        db.close()
        return

    # Manager
    manager = User(name="Jordan Lee", email="jordan@company.com",
                   hashed_password=hash_password("password123"),
                   role="manager", department="All", avatar="JL")
    db.add(manager)
    db.flush()

    # Mentors
    priya = User(name="Priya Mehta", email="priya@company.com",
                 hashed_password=hash_password("password123"),
                 role="mentor", department="Engineering", avatar="PM")
    sam = User(name="Sam Torres", email="sam@company.com",
               hashed_password=hash_password("password123"),
               role="mentor", department="Design", avatar="ST")
    alex = User(name="Alex Kim", email="alex@company.com",
                hashed_password=hash_password("password123"),
                role="mentor", department="Data", avatar="AK")
    db.add_all([priya, sam, alex])
    db.flush()

    # Interns
    chris = User(name="Chris Patel", email="chris@company.com",
                 hashed_password=hash_password("password123"),
                 role="intern", department="Engineering", avatar="CP", mentor_id=priya.id)
    dana = User(name="Dana Wu", email="dana@company.com",
                hashed_password=hash_password("password123"),
                role="intern", department="Engineering", avatar="DW", mentor_id=priya.id)
    felix = User(name="Felix Obi", email="felix@company.com",
                 hashed_password=hash_password("password123"),
                 role="intern", department="Design", avatar="FO", mentor_id=sam.id)
    mia = User(name="Mia Rossi", email="mia@company.com",
               hashed_password=hash_password("password123"),
               role="intern", department="Data", avatar="MR", mentor_id=alex.id)
    jake = User(name="Jake Lim", email="jake@company.com",
                hashed_password=hash_password("password123"),
                role="intern", department="Data", avatar="JL2", mentor_id=alex.id)
    db.add_all([chris, dana, felix, mia, jake])
    db.flush()

    # Tasks
    t1 = Task(title="Build REST API for user auth", department="Engineering",
              status="in-progress", priority="high", due_date="2025-07-18",
              requirements="Access to staging environment (request via IT ticket)\nGitHub repo: https://github.com/company/api-auth\nAPI spec doc: https://notion.so/api-spec",
              notes="Coordinate with frontend team. Use JWT tokens.", progress=45,
              is_group=True, mentor_id=priya.id)
    t1.assignees = [chris, dana]

    t2 = Task(title="Redesign onboarding flow", department="Design",
              status="in-review", priority="medium", due_date="2025-07-12",
              requirements="Figma file: https://figma.com/onboarding-v2\nBrand guidelines in Google Drive\nInterview notes from 5 user sessions",
              notes="Focus on mobile-first. Check brand kit for updated colors.", progress=85,
              is_group=False, mentor_id=sam.id)
    t2.assignees = [felix]

    t3 = Task(title="Build churn prediction model", department="Data",
              status="in-progress", priority="high", due_date="2025-07-25",
              requirements="Access: BigQuery — request via #data-access Slack\nDataset: gs://company-data/churn/train.csv\nPython 3.11, scikit-learn 1.3",
              notes="Baseline accuracy target: 80%. Document feature engineering.", progress=35,
              is_group=True, mentor_id=alex.id)
    t3.assignees = [mia, jake]

    t4 = Task(title="Write API documentation", department="Engineering",
              status="todo", priority="low", due_date="2025-07-30",
              requirements="Confluence space: Engineering > Docs\nOpenAPI spec file in /docs repo",
              notes="Use Swagger UI format. All endpoints must have examples.", progress=0,
              is_group=False, mentor_id=priya.id)
    t4.assignees = [chris]

    t5 = Task(title="A/B test analysis report", department="Data",
              status="done", priority="medium", due_date="2025-07-08",
              requirements="Data in BigQuery: analytics.ab_test_results\nReport template in Google Slides",
              notes="Completed. Good statistical rigor.", progress=100,
              is_group=False, mentor_id=alex.id)
    t5.assignees = [mia]

    t6 = Task(title="Component library updates", department="Design",
              status="blocked", priority="high", due_date="2025-07-15",
              requirements="Figma: Component Library v3\nStorybook: https://storybook.company.com",
              notes="Blocked waiting for design token decisions from brand team.", progress=20,
              is_group=False, mentor_id=sam.id)
    t6.assignees = [felix]

    db.add_all([t1, t2, t3, t4, t5, t6])
    db.commit()
    print("✅ Database seeded successfully!")
    print("\nLogin credentials (all passwords: password123):")
    print("  Manager:  jordan@company.com")
    print("  Mentors:  priya@company.com | sam@company.com | alex@company.com")
    print("  Interns:  chris@company.com | dana@company.com | felix@company.com | mia@company.com | jake@company.com")
    db.close()

if __name__ == "__main__":
    seed()
