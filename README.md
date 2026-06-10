# InternTrack

A full-stack intern task tracker with role-based access for managers, mentors, and interns.

## Tech stack
- **Backend**: Python + FastAPI + SQLite
- **Frontend**: React + Vite (served by FastAPI as static files)
- **Auth**: JWT tokens
- **Deploy**: Railway

---

## 🚀 Deploy to Railway (5 minutes)

### Option A — GitHub (recommended)

1. Push this folder to a GitHub repo:
   ```bash
   cd interntrack
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/interntrack.git
   git push -u origin main
   ```

2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**

3. Select your repo. Railway auto-detects `nixpacks.toml` and builds everything.

4. Set environment variables in Railway dashboard → **Variables**:
   ```
   SECRET_KEY=your-random-32-char-string-here
   ```
   Generate one with: `python3 -c "import secrets; print(secrets.token_hex(32))"`

5. Done! Railway gives you a public URL like `https://interntrack-production.up.railway.app`

### Option B — Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## 🔑 Default credentials

All passwords: `password123`

| Role    | Email                  |
|---------|------------------------|
| Manager | jordan@company.com     |
| Mentor  | priya@company.com      |
| Mentor  | sam@company.com        |
| Mentor  | alex@company.com       |
| Intern  | chris@company.com      |
| Intern  | dana@company.com       |
| Intern  | felix@company.com      |
| Intern  | mia@company.com        |
| Intern  | jake@company.com       |

**Change passwords before going live!**

---

## 💻 Run locally

```bash
# Install Python deps
cd backend
pip install -r requirements.txt

# Build frontend
cd ../frontend
npm install && npm run build

# Start server
cd ../backend
uvicorn main:app --reload --port 8000
```

Open http://localhost:8000

---

## 🔧 Environment variables

| Variable     | Description                        | Default                          |
|--------------|------------------------------------|----------------------------------|
| `SECRET_KEY` | JWT signing secret (change this!)  | `changeme-use-a-real-secret...`  |
| `DATABASE_URL` | SQLite path or postgres URL      | `sqlite:///./interntrack.db`     |
| `PORT`       | Server port (set by Railway)       | `8000`                           |

---

## 📁 Project structure

```
interntrack/
├── backend/
│   ├── main.py          # FastAPI app + all API routes
│   ├── models.py        # SQLAlchemy database models
│   ├── auth.py          # JWT auth utilities
│   ├── seed.py          # Demo data seeder
│   ├── requirements.txt
│   └── static/          # Built React app (auto-generated)
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Router
│   │   ├── lib/         # API client + AuthContext
│   │   ├── components/  # Layout, UI components
│   │   └── pages/       # Login, Dashboard, Tasks, etc.
│   ├── package.json
│   └── vite.config.js
├── nixpacks.toml        # Railway build config
├── railway.toml         # Railway deploy config
└── README.md
```

---

## 🔌 Microsoft Teams integration

To add this as a Teams app, create a `manifest.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
  "manifestVersion": "1.16",
  "id": "YOUR-GUID-HERE",
  "name": { "short": "InternTrack", "full": "InternTrack - Intern Task Manager" },
  "description": { "short": "Track intern tasks and progress", "full": "Manage intern tasks, assignments, and weekly reports" },
  "version": "1.0.0",
  "developer": { "name": "Your Company", "websiteUrl": "https://YOUR-RAILWAY-URL", "privacyUrl": "https://YOUR-RAILWAY-URL", "termsOfUseUrl": "https://YOUR-RAILWAY-URL" },
  "icons": { "outline": "outline.png", "color": "color.png" },
  "accentColor": "#4F6BED",
  "staticTabs": [{
    "entityId": "interntrack",
    "name": "InternTrack",
    "contentUrl": "https://YOUR-RAILWAY-URL",
    "websiteUrl": "https://YOUR-RAILWAY-URL",
    "scopes": ["personal"]
  }],
  "permissions": ["identity", "messageTeamMembers"],
  "validDomains": ["YOUR-RAILWAY-DOMAIN.up.railway.app"]
}
```

Then zip `manifest.json` + two icon PNGs and upload to Teams Admin Center.

---

## 📧 Friday email automation

The `/api/report/weekly` endpoint generates the report data. To send it automatically:

**Option 1 — APScheduler** (add to `main.py`):
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', day_of_week='fri', hour=17)
async def send_weekly_email():
    # Call your email provider (SendGrid, Postmark, etc.)
    pass

scheduler.start()
```

**Option 2 — Railway Cron** (free): Add a cron job in Railway dashboard that hits `POST /api/report/send` every Friday at 5 PM.
