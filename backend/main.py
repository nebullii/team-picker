"""Team Picker API — FastAPI backend."""

import sqlite3
import random
import os

from openai import OpenAI
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(title="Team Picker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "teams.db")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

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


def fetch_team_context(team_id: int) -> dict:
    """Fetch team stats and game history for LLM prompt building."""
    conn = get_db()
    team = conn.execute("SELECT * FROM teams WHERE id = ?", (team_id,)).fetchone()
    if not team:
        conn.close()
        return None

    wins = conn.execute(
        """SELECT game_number, date, winner_points as team_points,
           loser_points as opponent_points, t.name as opponent
           FROM games g JOIN teams t ON t.id = g.loser_id
           WHERE g.winner_id = ?""",
        (team_id,)
    ).fetchall()

    losses = conn.execute(
        """SELECT game_number, date, loser_points as team_points,
           winner_points as opponent_points, t.name as opponent
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


def call_llm(prompt: str) -> str:
    """Call OpenAI API and return the response text."""
    if not OPENAI_API_KEY:
        raise HTTPException(500, "OPENAI_API_KEY not configured")

    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a witty, snarky NFL analyst. Give a short, punchy take (3-5 sentences max) "
                    "on whether someone should root for this team based on their Super Bowl history. "
                    "Be funny and opinionated. No fluff. "
                    "Include a Root-O-Meter score from 0-100 on the first line in this exact format: "
                    "ROOTOMETER: <score>"
                ),
            },
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content


def build_team_prompt(team_data: dict) -> str:
    team = team_data["team"]
    history = team_data["history"]

    history_lines = []
    for g in history:
        result = "Won" if g["result"] == "W" else "Lost"
        history_lines.append(f"  Super Bowl {g['game_number']}: {result} {g['team_points']}-{g['opponent_points']} vs {g['opponent']}")

    history_text = "\n".join(history_lines) if history_lines else "  No Super Bowl appearances."

    return f"""Analyze the {team['name']} ({team['city']}) as a team to root for.

Stats:
- Conference: {team['conference']}
- Super Bowl Wins: {team['super_bowl_wins']}
- Super Bowl Losses: {team['super_bowl_losses']}
- Total Appearances: {team['total_appearances']}
- Total Points Scored (in SBs): {team['total_points_scored']}
- Total Points Allowed (in SBs): {team['total_points_allowed']}
- Rootability Score: {team['rootability_score']}/100

Super Bowl History:
{history_text}

Give a short, punchy verdict. No fluff."""


# --- Pydantic models ---

class AnalyzeRequest(BaseModel):
    team_id: int

class CompareAnalyzeRequest(BaseModel):
    team1_id: int
    team2_id: int


# --- Existing endpoints ---

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


@app.get("/api/teams/names")
def list_team_names():
    """Return just team id and name for dropdowns — no stats exposed."""
    conn = get_db()
    rows = conn.execute("SELECT id, name FROM teams ORDER BY name").fetchall()
    conn.close()
    return [{"id": r["id"], "name": r["name"]} for r in rows]


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


# --- New LLM-powered endpoints ---

@app.post("/api/analyze")
def analyze_team(req: AnalyzeRequest):
    """Get an LLM-generated snarky analysis of a team."""
    team_data = fetch_team_context(req.team_id)
    if not team_data:
        raise HTTPException(404, "Team not found")

    prompt = build_team_prompt(team_data)
    analysis = call_llm(prompt)

    # Parse ROOTOMETER score from response
    score = team_data["team"]["rootability_score"]  # fallback
    lines = analysis.split("\n")
    for line in lines:
        if "ROOTOMETER:" in line.upper():
            try:
                score = int("".join(c for c in line.split(":")[-1] if c.isdigit()))
            except ValueError:
                pass
            break

    return {
        "team_name": team_data["team"]["name"],
        "team_city": team_data["team"]["city"],
        "analysis": analysis,
        "rootometer_score": score,
    }


@app.post("/api/compare-analyze")
def compare_analyze(req: CompareAnalyzeRequest):
    """Get an LLM-generated head-to-head comparison of two teams."""
    t1_data = fetch_team_context(req.team1_id)
    t2_data = fetch_team_context(req.team2_id)
    if not t1_data or not t2_data:
        raise HTTPException(404, "One or both teams not found")

    t1 = t1_data["team"]
    t2 = t2_data["team"]

    prompt = f"""Compare the {t1['name']} and the {t2['name']} head-to-head as teams to root for.

{t1['name']} ({t1['city']}):
- SB Record: {t1['super_bowl_wins']}W-{t1['super_bowl_losses']}L in {t1['total_appearances']} appearances
- SB Points: {t1['total_points_scored']} scored, {t1['total_points_allowed']} allowed
- Rootability: {t1['rootability_score']}/100

{t2['name']} ({t2['city']}):
- SB Record: {t2['super_bowl_wins']}W-{t2['super_bowl_losses']}L in {t2['total_appearances']} appearances
- SB Points: {t2['total_points_scored']} scored, {t2['total_points_allowed']} allowed
- Rootability: {t2['rootability_score']}/100

Give a short, punchy head-to-head take (3-5 sentences max). Pick a winner. No fluff."""

    analysis = call_llm(prompt)

    return {
        "team1": {"name": t1["name"], "city": t1["city"], "rootability_score": t1["rootability_score"]},
        "team2": {"name": t2["name"], "city": t2["city"], "rootability_score": t2["rootability_score"]},
        "analysis": analysis,
    }
