"""Fetch current MOCS season data from mtgoupdate.com and update data.js.

Uses only stdlib — no dependencies required.
"""

import json
import re
import urllib.request
from datetime import date, datetime, timezone

# ---------------------------------------------------------------------------
# Season definitions (manually maintained when new seasons are announced)
# ---------------------------------------------------------------------------

SEASONS = [
    {
        "id": "2026-s2",
        "label": "2026 Season 2",
        "year": 2026,
        "seasonNum": 2,
        "start": "2026-03-25",
        "end": "2026-07-15",
        "showcaseFormats": ["Modern", "Legacy", "Standard", "Pauper"],
        "rotatingFormat": "Pauper",
        "notes": "Scheduled events restricted to players in certain geographic regions (Leagues and Queues unaffected).",
    },
    {
        "id": "2026-s1",
        "label": "2026 Season 1",
        "year": 2026,
        "seasonNum": 1,
        "start": "2025-12-03",
        "end": "2026-03-25",
        "showcaseFormats": ["Modern", "Legacy", "Standard", "Vintage"],
        "rotatingFormat": "Vintage",
        "notes": "",
    },
]

# ---------------------------------------------------------------------------
# Event data per season (scraped from mtgoupdate.com/scheduleData.js)
# ---------------------------------------------------------------------------

SEASON_EVENTS = {
    "2026-s1": [
        # Showcase Challenges
        {"date": "2026-01-03", "time": "10:00", "format": "Vintage", "type": "Showcase Challenge"},
        {"date": "2026-01-04", "time": "08:00", "format": "Legacy", "type": "Showcase Challenge"},
        {"date": "2026-01-11", "time": "08:00", "format": "Standard", "type": "Showcase Challenge"},
        {"date": "2026-02-07", "time": "06:00", "format": "Standard", "type": "Showcase Challenge"},
        {"date": "2026-02-08", "time": "08:00", "format": "Vintage", "type": "Showcase Challenge"},
        {"date": "2026-02-14", "time": "08:00", "format": "Modern", "type": "Showcase Challenge"},
        {"date": "2026-02-15", "time": "08:00", "format": "Legacy", "type": "Showcase Challenge"},
        {"date": "2026-03-01", "time": "08:00", "format": "Modern", "type": "Showcase Challenge"},
        {"date": "2026-03-08", "time": "08:00", "format": "Modern", "type": "Showcase Challenge"},
        {"date": "2026-03-14", "time": "08:00", "format": "Vintage", "type": "Showcase Challenge"},
        {"date": "2026-03-15", "time": "08:00", "format": "Legacy", "type": "Showcase Challenge"},
        {"date": "2026-03-21", "time": "08:00", "format": "Modern", "type": "Showcase Challenge"},
        {"date": "2026-03-22", "time": "08:00", "format": "Standard", "type": "Showcase Challenge"},

        # Last Chance Events (March 22-25)
        {"date": "2026-03-22", "time": "11:00", "format": "Modern", "type": "Last Chance Event"},
        {"date": "2026-03-22", "time": "19:00", "format": "Standard", "type": "Last Chance Event"},
        {"date": "2026-03-23", "time": "00:00", "format": "Modern", "type": "Last Chance Event"},
        {"date": "2026-03-23", "time": "04:00", "format": "Legacy", "type": "Last Chance Event"},
        {"date": "2026-03-23", "time": "08:00", "format": "Standard", "type": "Last Chance Event"},
        {"date": "2026-03-23", "time": "12:00", "format": "Vintage", "type": "Last Chance Event"},
        {"date": "2026-03-23", "time": "16:00", "format": "Modern", "type": "Last Chance Event"},
        {"date": "2026-03-23", "time": "20:00", "format": "Legacy", "type": "Last Chance Event"},
        {"date": "2026-03-24", "time": "00:00", "format": "Standard", "type": "Last Chance Event"},
        {"date": "2026-03-24", "time": "04:00", "format": "Vintage", "type": "Last Chance Event"},
        {"date": "2026-03-24", "time": "08:00", "format": "Modern", "type": "Last Chance Event"},
        {"date": "2026-03-24", "time": "12:00", "format": "Legacy", "type": "Last Chance Event"},
        {"date": "2026-03-24", "time": "16:00", "format": "Vintage", "type": "Last Chance Event"},
        {"date": "2026-03-24", "time": "20:00", "format": "Standard", "type": "Last Chance Event"},
        {"date": "2026-03-25", "time": "00:00", "format": "Vintage", "type": "Last Chance Event"},
        {"date": "2026-03-25", "time": "04:00", "format": "Legacy", "type": "Last Chance Event"},

        # Showcase Qualifiers
        {"date": "2026-03-28", "time": "08:00", "format": "Modern", "type": "Showcase Qualifier"},
        {"date": "2026-03-29", "time": "08:00", "format": "Standard", "type": "Showcase Qualifier"},
        {"date": "2026-04-04", "time": "08:00", "format": "Vintage", "type": "Showcase Qualifier"},
        {"date": "2026-04-05", "time": "08:00", "format": "Legacy", "type": "Showcase Qualifier"},

        # Showcase Opens (Sealed)
        {"date": "2026-04-11", "time": "07:00", "format": "Limited", "type": "Showcase Open"},
        {"date": "2026-04-12", "time": "07:00", "format": "Limited", "type": "Showcase Open"},

        # Qualifiers & Super Qualifiers
        {"date": "2025-12-05", "time": "07:00", "format": "Limited", "type": "Super Qualifier"},
        {"date": "2025-12-26", "time": "07:00", "format": "Modern", "type": "Super Qualifier"},
        {"date": "2025-12-29", "time": "07:00", "format": "Standard", "type": "Super Qualifier"},
        {"date": "2025-12-30", "time": "07:00", "format": "Limited", "type": "Super Qualifier"},
        {"date": "2026-01-02", "time": "07:00", "format": "Pioneer", "type": "Super Qualifier"},
        {"date": "2026-01-16", "time": "14:00", "format": "Modern", "type": "Qualifier"},
        {"date": "2026-01-19", "time": "07:00", "format": "Limited", "type": "Qualifier"},
        {"date": "2026-01-24", "time": "01:00", "format": "Modern", "type": "Super Qualifier"},
        {"date": "2026-01-25", "time": "07:00", "format": "Vintage", "type": "Super Qualifier"},
        {"date": "2026-01-30", "time": "14:00", "format": "Limited", "type": "Super Qualifier"},
        {"date": "2026-02-01", "time": "07:00", "format": "Standard", "type": "Super Qualifier"},
        {"date": "2026-02-06", "time": "07:00", "format": "Limited", "type": "Super Qualifier"},
        {"date": "2026-02-16", "time": "07:00", "format": "Limited", "type": "Super Qualifier"},
        {"date": "2026-02-21", "time": "07:00", "format": "Legacy", "type": "Qualifier"},
        {"date": "2026-02-22", "time": "07:00", "format": "Pauper", "type": "Qualifier"},
        {"date": "2026-02-28", "time": "01:00", "format": "Limited", "type": "Super Qualifier"},
        {"date": "2026-03-07", "time": "07:00", "format": "Legacy", "type": "Super Qualifier"},
    ],
    "2026-s2": [],  # Populated when mtgoupdate.com updates
}


def current_season_id() -> str:
    """Return the id of the season that contains today's date."""
    today = date.today().isoformat()
    for s in SEASONS:
        if s["start"] <= today <= s["end"]:
            return s["id"]
    return SEASONS[0]["id"]


def build_data_js() -> str:
    """Build the contents of data.js."""
    cur = current_season_id()
    seasons_out = []
    for s in SEASONS:
        seasons_out.append(
            {
                "id": s["id"],
                "label": s["label"],
                "year": s["year"],
                "seasonNum": s["seasonNum"],
                "current": s["id"] == cur,
                "start": s["start"],
                "end": s["end"],
                "showcaseFormats": s["showcaseFormats"],
                "rotatingFormat": s["rotatingFormat"],
                "events": SEASON_EVENTS.get(s["id"], []),
                "leaderboard": [],
                "notes": s.get("notes", ""),
            }
        )

    data = {
        "seasons": seasons_out,
        "structure": {
            "qpThreshold": 40,
            "championsShowcasePlayers": 8,
            "championsShowcasePrize": 50000,
            "worldsSeats": 2,
            "seasonsPerYear": 3,
        },
    }

    js = json.dumps(data, indent=2)
    return (
        "// Auto-generated by update.py — do not edit manually.\n"
        f"// Last updated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n\n"
        f"const MOCS_DATA = {js};\n"
    )


def main():
    content = build_data_js()
    with open("data.js", "w") as f:
        f.write(content)
    print(f"data.js updated ({len(content)} bytes)")


if __name__ == "__main__":
    main()
