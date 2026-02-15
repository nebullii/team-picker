# Build Decisions

## Tech Stack
- **Language**: Python 3.10+ backend, JavaScript frontend
- **Framework**: FastAPI + React 18 with Vite
- **Database**: SQLite (file-based, pre-seeded)
- **Styling**: Tailwind CSS

## Architecture
React frontend makes fetch calls to FastAPI backend. SQLite database bundled with backend. Single repo with frontend/ and backend/ directories. Frontend can be deployed to Vercel, backend to Railway/Render, or combined deployment.

## Reasoning
SQLite requires no setup and works great for read-heavy sports data. FastAPI gives automatic OpenAPI docs. React + Vite is fast for development. Tailwind enables rapid styling without custom CSS files.
