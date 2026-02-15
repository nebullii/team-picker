"""Team Picker API — FastAPI backend."""

import sqlite3
import random
import os

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Team Picker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "teams.db")

VERDICTS = [
    (20, "Abandon Ship", "This team will break your heart. Repeatedly."),
    (40, "Proceed with Caution", "Hope is a dangerous thing, and this team knows it."),
    (60, "Solid Pick", "Respectable. Won't embarrass you at parties."),
    (80, "Great Choice", "You'll have plenty to cheer about."),
    (100, "Bandwagon Approved", "Everyone loves a winner. Welcome aboard."),
]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_verdict(score: int) -> dict:
    for threshold, label, description in VERDICTS:
        if score <= threshold:
            return {"label": label, "description": description}
    return {"label": "Bandwagon Approved", "description": "Everyone loves a winner. Welcome aboard."}


def team_to_dict(row) -> dict:
    d = dict(row)
    d["verdict"] = get_verdict(d["rootability_score"])
    return d


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/teams")
def list_teams(search: str = Query(default="")):
    conn = get_db()
    if search:
        rows = conn.execute(
            "SELECT * FROM teams WHERE name LIKE ? OR city LIKE ? ORDER BY rootability_score DESC",
            (f"%{search}%", f"%{search}%")
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM teams ORDER BY rootability_score DESC").fetchall()
    conn.close()
    return [team_to_dict(r) for r in rows]


@app.get("/api/teams/random")
def random_team():
    conn = get_db()
    rows = conn.execute("SELECT * FROM teams").fetchall()
    conn.close()
    if not rows:
        raise HTTPException(404, "No teams found")
    return team_to_dict(random.choice(rows))


@app.get("/api/teams/{team_id}")
def get_team(team_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM teams WHERE id = ?", (team_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Team not found")
    return team_to_dict(row)


@app.get("/api/teams/{team_id}/history")
def team_history(team_id: int):
    conn = get_db()
    team = conn.execute("SELECT * FROM teams WHERE id = ?", (team_id,)).fetchone()
    if not team:
        conn.close()
        raise HTTPException(404, "Team not found")

    wins = conn.execute(
        """SELECT game_number, date, winner_points as team_points,
           loser_points as opponent_points, t.name as opponent,
           g.venue, g.city, g.attendance
           FROM games g JOIN teams t ON t.id = g.loser_id
           WHERE g.winner_id = ?""",
        (team_id,)
    ).fetchall()

    losses = conn.execute(
        """SELECT game_number, date, loser_points as team_points,
           winner_points as opponent_points, t.name as opponent,
           g.venue, g.city, g.attendance
           FROM games g JOIN teams t ON t.id = g.winner_id
           WHERE g.loser_id = ?""",
        (team_id,)
    ).fetchall()
    conn.close()

    history = []
    for r in wins:
        history.append({**dict(r), "result": "W"})
    for r in losses:
        history.append({**dict(r), "result": "L"})

    history.sort(key=lambda x: x["date"])
    return {"team": dict(team), "history": history}


@app.get("/api/compare")
def compare_teams(team1: int = Query(...), team2: int = Query(...)):
    conn = get_db()
    t1 = conn.execute("SELECT * FROM teams WHERE id = ?", (team1,)).fetchone()
    t2 = conn.execute("SELECT * FROM teams WHERE id = ?", (team2,)).fetchone()
    conn.close()
    if not t1 or not t2:
        raise HTTPException(404, "One or both teams not found")
    return {"team1": team_to_dict(t1), "team2": team_to_dict(t2)}
