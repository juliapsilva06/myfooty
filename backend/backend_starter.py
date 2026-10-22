"""
Sports dashboard backend (starter)

Setup:
    pip install fastapi uvicorn httpx anthropic
    export FOOTBALL_DATA_TOKEN=...   # from football-data.org
    export ANTHROPIC_API_KEY=...
    uvicorn backend_starter:app --reload

Notes:
- Free tier is limited to 10 requests/minute, so every call goes through
  a cache and a simple rate limiter.
- Replace FAVORITES with your teams/leagues. Find team IDs with:
    GET https://api.football-data.org/v4/competitions/PL/teams
- Always verify endpoint behavior against the official docs:
    https://docs.football-data.org/general/v4/
"""

import json
import os
import time
from collections import deque

import anthropic
import httpx
from fastapi import FastAPI
from pydantic import BaseModel

FD_BASE = "https://api.football-data.org/v4"
FD_TOKEN = os.environ["FOOTBALL_DATA_TOKEN"]
MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-5-5")

# ---- Your favorites (placeholders: replace with your own) -------------------
FAVORITES = {
    "teams": [{"id": 57, "name": "Arsenal"}],
    "competitions": ["PL"],
}

# ---- Cache + rate limiting ---------------------------------------------------
_cache: dict[str, tuple[float, dict]] = {}
_calls: deque[float] = deque()
MAX_CALLS_PER_MIN = 10  # free tier


def _wait_for_slot() -> None:
    now = time.time()
    while _calls and now - _calls[0] > 60:
        _calls.popleft()
    if len(_calls) >= MAX_CALLS_PER_MIN:
        time.sleep(60 - (now - _calls[0]) + 0.1)
    _calls.append(time.time())


def fd_get(path: str, params: dict | None = None, ttl: int = 300) -> dict:
    """GET from football-data.org with TTL caching (seconds)."""
    key = f"{path}?{json.dumps(params or {}, sort_keys=True)}"
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < ttl:
        return hit[1]

    _wait_for_slot()
    r = httpx.get(
        f"{FD_BASE}{path}",
        params=params,
        headers={"X-Auth-Token": FD_TOKEN},
        timeout=15,
    )
    r.raise_for_status()
    data = r.json()
    _cache[key] = (time.time(), data)
    return data


# ---- Data functions (also used as agent tools) ------------------------------
def _slim_match(m: dict) -> dict:
    ft = m["score"]["fullTime"]
    return {
        "date": m["utcDate"],
        "competition": m["competition"]["name"],
        "home": m["homeTeam"]["name"],
        "away": m["awayTeam"]["name"],
        "status": m["status"],
        "score": f'{ft["home"]}-{ft["away"]}' if ft["home"] is not None else None,
    }


def get_next_match(team_id: int) -> dict:
    data = fd_get(f"/teams/{team_id}/matches", {"status": "SCHEDULED"}, ttl=3600)
    matches = data.get("matches", [])
    return _slim_match(matches[0]) if matches else {"info": "No scheduled matches found"}


def get_recent_results(team_id: int, n: int = 5) -> list[dict]:
    data = fd_get(f"/teams/{team_id}/matches", {"status": "FINISHED"}, ttl=1800)
    # Matches come back oldest-first, so take the last n
    return [_slim_match(m) for m in data.get("matches", [])[-n:]]


def get_standings(competition: str) -> list[dict]:
    data = fd_get(f"/competitions/{competition}/standings", ttl=3 * 3600)
    table = data["standings"][0]["table"]
    return [
        {
            "pos": row["position"],
            "team": row["team"]["name"],
            "played": row["playedGames"],
            "won": row["won"],
            "draw": row["draw"],
            "lost": row["lost"],
            "gd": row["goalDifference"],
            "points": row["points"],
        }
        for row in table
    ]


def get_favorites() -> dict:
    return FAVORITES


TOOL_FUNCS = {
    "get_next_match": get_next_match,
    "get_recent_results": get_recent_results,
    "get_standings": get_standings,
    "get_favorites": get_favorites,
}

TOOLS = [
    {
        "name": "get_favorites",
        "description": "Get the user's favorite teams (with IDs) and competitions (with codes).",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_next_match",
        "description": "Get a team's next scheduled match.",
        "input_schema": {
            "type": "object",
            "properties": {"team_id": {"type": "integer"}},
            "required": ["team_id"],
        },
    },
    {
        "name": "get_recent_results",
        "description": "Get a team's most recent finished matches.",
        "input_schema": {
            "type": "object",
            "properties": {
                "team_id": {"type": "integer"},
                "n": {"type": "integer", "description": "How many matches (default 5)"},
            },
            "required": ["team_id"],
        },
    },
    {
        "name": "get_standings",
        "description": "Get the league table for a competition code like 'PL'.",
        "input_schema": {
            "type": "object",
            "properties": {"competition": {"type": "string"}},
            "required": ["competition"],
        },
    },
]

SYSTEM_PROMPT = """You are a concise sports assistant inside a personal dashboard.
- Answer ONLY from tool results. If the data isn't available, say so plainly.
- If a question is ambiguous, assume the user's favorite teams/leagues (call get_favorites).
- Scores on the free data tier can be delayed; mention that when it matters.
- Keep answers short and scannable."""

# ---- App ---------------------------------------------------------------------
app = FastAPI()
client = anthropic.Anthropic()


@app.get("/api/dashboard")
def dashboard() -> dict:
    return {
        "teams": [
            {
                "team": t["name"],
                "next_match": get_next_match(t["id"]),
                "recent_results": get_recent_results(t["id"], 5),
            }
            for t in FAVORITES["teams"]
        ],
        "standings": {c: get_standings(c) for c in FAVORITES["competitions"]},
    }


class ChatRequest(BaseModel):
    message: str


@app.post("/api/chat")
def chat(req: ChatRequest) -> dict:
    messages = [{"role": "user", "content": req.message}]

    for _ in range(6):  # cap tool-use loop
        resp = client.messages.create(
            model=MODEL,
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        if resp.stop_reason != "tool_use":
            text = "".join(b.text for b in resp.content if b.type == "text")
            return {"answer": text}

        messages.append({"role": "assistant", "content": resp.content})
        results = []
        for block in resp.content:
            if block.type == "tool_use":
                try:
                    out = TOOL_FUNCS[block.name](**block.input)
                except Exception as e:  # report errors back to the model
                    out = {"error": str(e)}
                results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(out),
                    }
                )
        messages.append({"role": "user", "content": results})

    return {"answer": "Sorry, I couldn't finish that request."}
