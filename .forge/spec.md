# Project: Team Picker

## What
A web application that tells you whether rooting for a particular NFL team is a good idea based on their Super Bowl performance history. Search for any NFL team and get a fun, data-driven verdict on whether they're worth cheering for.

## Users
- Sports fans deciding which team to root for
- Casual viewers who want to pick a winning side before a game
- Friends settling debates about whose team is better

## Features
- [ ] Search bar to find teams by name or city
- [ ] Team profile card showing key stats (Super Bowl wins, losses, win rate, total appearances)
- [ ] "Root-O-Meter" verdict gauge from "Abandon Ship" to "Bandwagon Approved"
- [ ] Fun snarky verdict text explaining why you should or shouldn't root for them
- [ ] Super Bowl history timeline for each team (wins and losses by year)
- [ ] Head-to-head comparison mode (compare two teams side by side)
- [ ] "Pick a Random Team" button for the indecisive
- [ ] Pre-seeded SQLite database built from the provided CSV at build time

## Data Source
A CSV file is provided at the project root: `ThrowbackDataThursday 2019 Week 5 - Super Bowl.csv`

It contains all 53 Super Bowl results (Super Bowl I through LIII) with columns:
- index, Game (roman numeral), Date
- Winning team, Winning Team Points, Winning Team Conference
- Score
- Losing team, Losing Team Points, Losing Team Conference
- Venue, City, Attendance
- Network, Average U.S. Viewers, Rating, Share, Cost Per 30s Ad, Notes

**Build-time seeding approach**: Create a `backend/seed_db.py` script that:
1. Reads the CSV file
2. Extracts unique teams from both "Winning team" and "Losing team" columns
3. Aggregates per-team stats: total Super Bowl wins, losses, appearances, points scored
4. Stores the raw game data for historical timeline views
5. Computes the rootability score per team
6. Writes everything into `backend/teams.db` (SQLite)

This script runs ONCE at setup time. The API only reads from SQLite — no CSV parsing at runtime.

## Tech Stack
- Frontend: React with Vite
- Backend: FastAPI (Python)
- Database: SQLite (pre-seeded from CSV via seed_db.py)
- Styling: Tailwind CSS

## Pages
- `/` - Home page with search bar, random team button, and team cards grid
- `/team/:id` - Team detail page with stats, verdict, Super Bowl timeline
- `/compare` - Head-to-head comparison of two teams

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/teams` - List all teams (supports `?search=` query param)
- `GET /api/teams/:id` - Get team details with full stats and verdict
- `GET /api/teams/:id/history` - Get Super Bowl appearances (wins and losses by year)
- `GET /api/compare?team1=:id&team2=:id` - Compare two teams
- `GET /api/teams/random` - Get a random team

## Data Model

### teams table
- id (integer, primary key)
- name (text) - e.g. "New England Patriots"
- city (text) - e.g. "New England"
- conference (text) - AFC or NFC
- super_bowl_wins (integer)
- super_bowl_losses (integer)
- total_appearances (integer)
- total_points_scored (integer) - across all Super Bowl games
- total_points_allowed (integer)
- rootability_score (integer, 0-100)

### games table
- id (integer, primary key)
- game_number (text) - roman numeral e.g. "XLII"
- date (text)
- winner_id (foreign key to teams)
- loser_id (foreign key to teams)
- winner_points (integer)
- loser_points (integer)
- venue (text)
- city (text)
- attendance (integer)

### Rootability Score Formula
Computed from Super Bowl data:
- Win percentage in Super Bowls (40% weight) — wins / appearances
- Total championships (30% weight) — scaled 0-100 where 6 wins = 100
- Blowout factor (15% weight) — average margin of victory
- Appearance frequency (15% weight) — total appearances scaled 0-100 where 11 = 100

Teams with 0 Super Bowl appearances get a base score of 10 ("Abandon Ship").

## Verdict Logic
The rootability score maps to fun verdicts:
- 0-20: "Abandon Ship" — "This team will break your heart. Repeatedly."
- 21-40: "Proceed with Caution" — "Hope is a dangerous thing, and this team knows it."
- 41-60: "Solid Pick" — "Respectable. Won't embarrass you at parties."
- 61-80: "Great Choice" — "You'll have plenty to cheer about."
- 81-100: "Bandwagon Approved" — "Everyone loves a winner. Welcome aboard."

## Vibe
Fun, playful, slightly snarky. Sports-themed with bold colors (dark navy, bright green accents, red for bad scores). Should feel like getting advice from a witty sports commentator friend.
