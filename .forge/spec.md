# Project: Team Picker

## What
A web application that tells you whether rooting for a particular sports team is a good idea based on their historical performance. Search for any major sports team (NFL, NBA, MLB, NHL, soccer) and get a fun, data-driven verdict on whether they're worth cheering for.

## Users
- Sports fans deciding which team to root for
- Casual viewers who want to pick a winning side before a game
- Friends settling debates about whose team is better

## Features
- [ ] Search bar to find teams by name, city, or league
- [ ] Team profile card showing key stats (win rate, championships, current streak)
- [ ] "Root-O-Meter" verdict gauge from "Abandon Ship" to "Bandwagon Approved"
- [ ] Fun verdict text explaining why you should or shouldn't root for them
- [ ] Historical win/loss trend chart (last 10 seasons)
- [ ] Head-to-head comparison mode (compare two teams side by side)
- [ ] "Pick a Random Team" button for the indecisive
- [ ] Pre-seeded database with real team data across major leagues

## Tech Stack
- Frontend: React with Vite
- Backend: FastAPI (Python)
- Database: SQLite (pre-seeded with team data)
- Styling: Tailwind CSS

## Pages
- `/` - Home page with search bar, random team button, and featured teams
- `/team/:id` - Team detail page with stats, verdict, and trend chart
- `/compare` - Head-to-head comparison of two teams

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/teams` - List all teams (supports `?search=` and `?league=` query params)
- `GET /api/teams/:id` - Get team details with full stats and verdict
- `GET /api/teams/:id/history` - Get season-by-season win/loss data
- `GET /api/compare?team1=:id&team2=:id` - Compare two teams
- `GET /api/teams/random` - Get a random team
- `GET /api/leagues` - List available leagues

## Data Model
Each team should have:
- name, city, league, conference/division
- total_wins, total_losses, championships
- recent seasons data (last 10 years of win/loss records)
- current_streak (wins or losses in a row)
- a computed "rootability score" (0-100) based on: win percentage (40%), championships (20%), recent trend (25%), current streak (15%)

## Verdict Logic
The rootability score maps to fun verdicts:
- 0-20: "Abandon Ship" - This team will break your heart
- 21-40: "Proceed with Caution" - Hope is a dangerous thing
- 41-60: "Solid Pick" - Respectable, won't embarrass you at parties
- 61-80: "Great Choice" - You'll have plenty to cheer about
- 81-100: "Bandwagon Approved" - Everyone loves a winner

## Vibe
Fun, playful, slightly snarky. Sports-themed with bold colors. Should feel like getting advice from a witty sports commentator friend. Use team-colored accents where possible.
