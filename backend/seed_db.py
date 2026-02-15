"""Seed the SQLite database from the Super Bowl CSV file."""

import csv
import sqlite3
import os

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "ThrowbackDataThursday 2019 Week 5 - Super Bowl.csv")
DB_PATH = os.path.join(os.path.dirname(__file__), "teams.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL,
    conference TEXT NOT NULL,
    super_bowl_wins INTEGER DEFAULT 0,
    super_bowl_losses INTEGER DEFAULT 0,
    total_appearances INTEGER DEFAULT 0,
    total_points_scored INTEGER DEFAULT 0,
    total_points_allowed INTEGER DEFAULT 0,
    rootability_score INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_number TEXT NOT NULL,
    date TEXT NOT NULL,
    winner_id INTEGER REFERENCES teams(id),
    loser_id INTEGER REFERENCES teams(id),
    winner_points INTEGER NOT NULL,
    loser_points INTEGER NOT NULL,
    venue TEXT,
    city TEXT,
    attendance INTEGER
);
"""


def extract_city(team_name: str) -> str:
    """Extract city/region from team name (everything except last word)."""
    parts = team_name.strip().split()
    # Handle two-word city names
    two_word_cities = {"New York", "New England", "Green Bay", "Kansas City",
                       "Los Angeles", "San Francisco", "San Diego", "St. Louis",
                       "Tampa Bay", "New Orleans"}
    for city in two_word_cities:
        if team_name.startswith(city):
            return city
    return " ".join(parts[:-1]) if len(parts) > 1 else parts[0]


def compute_rootability(wins: int, losses: int, appearances: int,
                        points_scored: int, points_allowed: int) -> int:
    """Compute rootability score (0-100)."""
    if appearances == 0:
        return 10

    # Win percentage (40% weight)
    win_pct = (wins / appearances) * 100
    win_score = win_pct * 0.40

    # Total championships (30% weight) — 6 wins = 100
    champ_score = min(wins / 6, 1.0) * 100 * 0.30

    # Blowout factor (15% weight) — average margin of victory
    if wins > 0:
        avg_margin = (points_scored - points_allowed) / appearances
        blowout_score = min(max(avg_margin / 20, 0), 1.0) * 100 * 0.15
    else:
        blowout_score = 0

    # Appearance frequency (15% weight) — 11 appearances = 100
    appear_score = min(appearances / 11, 1.0) * 100 * 0.15

    return max(10, min(100, int(win_score + champ_score + blowout_score + appear_score)))


def seed():
    """Parse CSV and populate the database."""
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)

    # Read CSV
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Collect unique teams and their stats
    team_stats = {}

    for row in rows:
        winner = row["Winning team"].strip()
        loser = row["Losing team"].strip()
        w_pts = int(row["Winning Team Points"])
        l_pts = int(row["Losing Team Points"])
        w_conf = row["Winning Team Conference"].strip()
        l_conf = row["Losing Team Conference"].strip()

        # Initialize teams
        for name, conf in [(winner, w_conf), (loser, l_conf)]:
            if name not in team_stats:
                team_stats[name] = {
                    "conference": conf,
                    "wins": 0, "losses": 0,
                    "points_scored": 0, "points_allowed": 0,
                }
            # Update conference to most recent
            team_stats[name]["conference"] = conf

        # Record win/loss
        team_stats[winner]["wins"] += 1
        team_stats[winner]["points_scored"] += w_pts
        team_stats[winner]["points_allowed"] += l_pts

        team_stats[loser]["losses"] += 1
        team_stats[loser]["points_scored"] += l_pts
        team_stats[loser]["points_allowed"] += w_pts

    # Insert teams
    team_ids = {}
    for name, stats in team_stats.items():
        appearances = stats["wins"] + stats["losses"]
        score = compute_rootability(
            stats["wins"], stats["losses"], appearances,
            stats["points_scored"], stats["points_allowed"]
        )
        conn.execute(
            """INSERT INTO teams (name, city, conference, super_bowl_wins,
               super_bowl_losses, total_appearances, total_points_scored,
               total_points_allowed, rootability_score)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (name, extract_city(name), stats["conference"],
             stats["wins"], stats["losses"], appearances,
             stats["points_scored"], stats["points_allowed"], score)
        )
        team_ids[name] = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

    # Insert games
    for row in rows:
        winner = row["Winning team"].strip()
        loser = row["Losing team"].strip()
        attendance = row.get("Attendance", "0").replace(",", "").strip()
        conn.execute(
            """INSERT INTO games (game_number, date, winner_id, loser_id,
               winner_points, loser_points, venue, city, attendance)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (row["Game"].strip(), row["Date"].strip(),
             team_ids[winner], team_ids[loser],
             int(row["Winning Team Points"]), int(row["Losing Team Points"]),
             row["Venue"].strip(), row["City"].strip(),
             int(attendance) if attendance.isdigit() else 0)
        )

    conn.commit()
    print(f"Seeded {len(team_stats)} teams and {len(rows)} games into {DB_PATH}")
    conn.close()


if __name__ == "__main__":
    seed()
