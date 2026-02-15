# Team Picker

Should you root for them? A data-driven verdict on NFL teams based on Super Bowl history.

## Features

- Search teams by name or city
- "Root-O-Meter" score (0-100) with snarky verdicts
- Super Bowl history timeline per team
- Head-to-head team comparison
- "Pick a Random Team" button

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: SQLite (pre-seeded from Super Bowl CSV)

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed_db.py          # Seeds the database from CSV (run once)
uvicorn main:app --reload  # Starts API on :8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # Starts dev server on :3000 (proxies /api to :8000)
```

### API Endpoints

- `GET /api/teams` — List all teams (supports `?search=`)
- `GET /api/teams/:id` — Team details with verdict
- `GET /api/teams/:id/history` — Super Bowl game history
- `GET /api/teams/random` — Random team
- `GET /api/compare?team1=:id&team2=:id` — Compare two teams

## Data

Uses Super Bowl results (I–LIII) from `ThrowbackDataThursday 2019 Week 5 - Super Bowl.csv`. The seed script extracts 32 unique teams, computes rootability scores based on win %, championships, point margins, and appearance frequency, then writes to SQLite.

Built with [Forge](https://github.com/nebullii/forge).
