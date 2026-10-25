"""
Julia Silva's myfooty
Sports dashboard backend

Setup:
    pip install fastapi uvicorn httpx anthropic
    export FOOTBALL_DATA_TOKEN=...
    export ANTHROPIC_API_KEY=...
    uvicorn backend_v2:app --reload

"""

import json
import os
import threading
import time
from collections import deque
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import anthropic
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()

FD_BASE = "https://api.football-data.org/v4"
FD_TOKEN = os.environ["FOOTBALL_DATA_TOKEN"]
MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-5-5")

BASE_DIR = Path(__file__).parent
PREFS_PATH = BASE_DIR / "prefs.json"
INDEX_PATH = BASE_DIR / "search_index.json"

# =============================================================================
# 1. football-data.org client: cache + rate limit (free tier: 10 req/min)
# =============================================================================
MAX_CALLS_PER_MIN = 10
_cache: dict[str, tuple[float, dict]] = {}
_calls: deque[float] = deque()
_lock = threading.Lock()


def _wait_for_slot() -> None:
    with _lock:
        while True:
            now = time.time()
            while _calls and now - _calls[0] > 60:
                _calls.popleft()
            if len(_calls) < MAX_CALLS_PER_MIN:
                break
            time.sleep(60 - (now - _calls[0]) + 0.1)
        _calls.append(time.time())


def fd_get(path: str, params: dict | None = None, ttl: int = 300) -> dict:
    key = f"{path}?{json.dumps(params or {}, sort_keys=True)}"
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < ttl:
        return hit[1]

    _wait_for_slot()
    r = httpx.get(
        f"{FD_BASE}{path}",
        params=params,
        headers={"X-Auth-Token": FD_TOKEN},
        timeout=20,
    )
    r.raise_for_status()
    data = r.json()
    _cache[key] = (time.time(), data)
    return data


# =============================================================================
# 2. Stat catalog: single source of truth for what can be offered
#    "available" will be flipped to True when the API plan is upgraded.
# =============================================================================
STAT_CATALOG = {
    "form": {"label": "Recent results and form", "available": True},
    "standings": {"label": "League table (points, goal difference)", "available": True},
    "goals": {"label": "Top scorers (goals)", "available": True},
    "assists": {"label": "Assists among top scorers", "available": True},
    "possession": {"label": "Possession", "available": False, "note": "Needs a paid statistics add-on"},
    "shots": {"label": "Shots", "available": False, "note": "Needs a paid statistics add-on"},
    "cards": {"label": "Cards", "available": False, "note": "Needs a paid data tier"},
    "lineups": {"label": "Lineups", "available": False, "note": "Needs a paid data tier"},
    "live_scores": {"label": "Live scores", "available": False, "note": "Free tier scores are delayed"},
}


def list_available_stats() -> dict:
    return {
        "available": {k: v["label"] for k, v in STAT_CATALOG.items() if v["available"]},
        "unavailable": {
            k: f'{v["label"]}: {v.get("note", "not supported")}'
            for k, v in STAT_CATALOG.items()
            if not v["available"]
        },
    }


# =============================================================================
# 3. Preferences
# =============================================================================
def load_prefs() -> dict | None:
    return json.loads(PREFS_PATH.read_text()) if PREFS_PATH.exists() else None


def write_prefs(prefs: dict) -> None:
    PREFS_PATH.write_text(json.dumps(prefs, indent=2))


def get_preferences() -> dict:
    return load_prefs() or {"info": "User has not set preferences yet"}


# =============================================================================
# 4. Search index (built once, refreshed weekly, searched locally)
# =============================================================================
_index: dict = {"built_at": 0, "competitions": [], "teams": []}


def build_index() -> dict:
    comps = fd_get("/competitions", ttl=86400).get("competitions", [])
    competitions, teams = [], {}
    for c in comps:
        code = c.get("code")
        # Skip competitions outside the free plan (verify the "plan" field on your token)
        if not code or c.get("plan") not in (None, "TIER_ONE"):
            continue
        try:
            data = fd_get(f"/competitions/{code}/teams", ttl=86400)
        except httpx.HTTPError:
            continue  # not accessible with this token
        competitions.append(
            {"code": code, "name": c["name"], "area": c.get("area", {}).get("name", "")}
        )
        for t in data.get("teams", []):
            entry = teams.setdefault(
                t["id"],
                {
                    "id": t["id"],
                    "name": t["name"],
                    "short": t.get("shortName") or t["name"],
                    "tla": t.get("tla") or "",
                    "competitions": [],
                },
            )
            if code not in entry["competitions"]:
                entry["competitions"].append(code)

    idx = {"built_at": time.time(), "competitions": competitions, "teams": list(teams.values())}
    INDEX_PATH.write_text(json.dumps(idx))
    return idx


def load_index() -> None:
    global _index
    try:
        if INDEX_PATH.exists():
            _index = json.loads(INDEX_PATH.read_text())
            if time.time() - _index.get("built_at", 0) < 7 * 86400:
                return
        _index = build_index()
    except Exception as e:  # keep the app alive if the index build fails
        print("Index build failed:", e)


def _rank(fields: list[str], q: str) -> int | None:
    ranks = []
    for f in fields:
        f = f.lower()
        if f == q:
            ranks.append(0)
        elif f.startswith(q):
            ranks.append(1)
        elif q in f:
            ranks.append(2)
    return min(ranks) if ranks else None


def search(query: str, limit: int = 8) -> dict:
    q = query.strip().lower()
    if not q:
        return {"teams": [], "competitions": []}

    teams = []
    for t in _index["teams"]:
        r = _rank([t["name"], t["short"], t["tla"]], q)
        if r is not None:
            teams.append((r, t))
    teams.sort(key=lambda x: (x[0], x[1]["name"]))

    comps = []
    for c in _index["competitions"]:
        r = _rank([c["name"], c["code"], c["area"]], q)
        if r is not None:
            comps.append((r, c))
    comps.sort(key=lambda x: (x[0], x[1]["name"]))

    return {
        "teams": [t for _, t in teams[:limit]],
        "competitions": [c for _, c in comps[:limit]],
    }


# =============================================================================
# 5. Data functions (used by widgets, endpoints, and agent tools)
# =============================================================================
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


def _outcome(m: dict, team_id: int) -> str | None:
    ft = m["score"]["fullTime"]
    if ft["home"] is None:
        return None
    is_home = m["homeTeam"]["id"] == team_id
    mine, theirs = (ft["home"], ft["away"]) if is_home else (ft["away"], ft["home"])
    return "W" if mine > theirs else "L" if mine < theirs else "D"


def get_next_match(team_id: int) -> dict:
    data = fd_get(f"/teams/{team_id}/matches", {"status": "SCHEDULED"}, ttl=3600)
    matches = data.get("matches", [])
    return _slim_match(matches[0]) if matches else {"info": "No scheduled matches found"}


def get_recent_results(team_id: int, n: int = 5) -> list[dict]:
    data = fd_get(f"/teams/{team_id}/matches", {"status": "FINISHED"}, ttl=1800)
    recent = data.get("matches", [])[-n:]  # API returns oldest first
    return [{**_slim_match(m), "outcome": _outcome(m, team_id)} for m in recent]


def get_standings(competition: str, highlight_team_ids: list[int] | None = None, top: int | None = None) -> list[dict]:
    # Note: uses the first standings group only (fine for leagues, not for group-stage cups)
    data = fd_get(f"/competitions/{competition}/standings", ttl=3 * 3600)
    table = data["standings"][0]["table"]
    rows = [
        {
            "pos": r["position"],
            "team_id": r["team"]["id"],
            "team": r["team"]["name"],
            "played": r["playedGames"],
            "won": r["won"],
            "draw": r["draw"],
            "lost": r["lost"],
            "gd": r["goalDifference"],
            "points": r["points"],
        }
        for r in table
    ]
    if top:
        keep = set(highlight_team_ids or [])
        rows = [r for r in rows if r["pos"] <= top or r["team_id"] in keep]
    return rows


def get_top_scorers(competition: str, sort_by: str = "goals", limit: int = 10) -> list[dict]:
    # Assists are only listed for players who appear in the top scorers,
    # so sorting by assists ranks assists *among top scorers*.
    data = fd_get(f"/competitions/{competition}/scorers", {"limit": 50}, ttl=3 * 3600)
    rows = [
        {
            "player": s["player"]["name"],
            "team": s["team"]["name"],
            "played": s.get("playedMatches"),
            "goals": s.get("goals") or 0,
            "assists": s.get("assists") or 0,
            "penalties": s.get("penalties") or 0,
        }
        for s in data.get("scorers", [])
    ]
    if sort_by == "assists":
        rows.sort(key=lambda r: r["assists"], reverse=True)
    return rows[:limit]


# =============================================================================
# 6. Preferences -> widget layout (deterministic; the model never designs UI)
# =============================================================================
def save_preferences(teams: list[dict], competitions: list[str], stats: list[str]) -> dict:
    known_teams = {t["id"]: t for t in _index["teams"]}
    known_codes = {c["code"] for c in _index["competitions"]}
    errors, clean_teams, clean_comps, clean_stats = [], [], [], []

    for t in teams:
        known = known_teams.get(t.get("id"))
        if known:
            clean_teams.append({"id": known["id"], "name": known["name"]})
        else:
            errors.append(f'Unknown team id {t.get("id")}. Use search to find the right id.')

    for c in competitions:
        if c in known_codes:
            clean_comps.append(c)
        else:
            errors.append(f"Unknown competition code '{c}'. Use search to find the code.")

    for s in stats:
        spec = STAT_CATALOG.get(s)
        if spec and spec["available"]:
            clean_stats.append(s)
        else:
            errors.append(f"Stat '{s}' is not available. Call list_available_stats.")

    if errors:
        return {"saved": False, "errors": errors}
    if not clean_teams and not clean_comps:
        return {"saved": False, "errors": ["Need at least one team or competition."]}

    prefs = {
        "teams": clean_teams,
        "competitions": clean_comps,
        "stats": clean_stats or ["form", "standings"],
    }
    write_prefs(prefs)
    return {"saved": True, "preferences": prefs}


def build_widgets(prefs: dict) -> list[dict]:
    stats = set(prefs["stats"])
    team_ids = [t["id"] for t in prefs["teams"]]
    widgets = []

    for t in prefs["teams"]:
        widgets.append(
            {"id": f'next_match:{t["id"]}', "type": "next_match", "team_id": t["id"], "title": f'{t["name"]}: next match'}
        )
        if "form" in stats:
            widgets.append(
                {"id": f'recent_results:{t["id"]}', "type": "recent_results", "team_id": t["id"], "n": 5, "title": f'{t["name"]}: recent form'}
            )

    for code in prefs["competitions"]:
        if "standings" in stats:
            widgets.append(
                {"id": f"standings:{code}", "type": "standings", "competition": code, "highlight_team_ids": team_ids, "top": 5, "title": f"{code}: table"}
            )
        if "goals" in stats:
            widgets.append(
                {"id": f"top_scorers:{code}", "type": "top_scorers", "competition": code, "title": f"{code}: top scorers"}
            )
        if "assists" in stats:
            widgets.append(
                {"id": f"top_assists:{code}", "type": "top_assists", "competition": code, "title": f"{code}: assists among top scorers"}
            )
    return widgets


def widget_data(w: dict):
    t = w.get("type")
    if t == "next_match":
        return get_next_match(w["team_id"])
    if t == "recent_results":
        return get_recent_results(w["team_id"], w.get("n", 5))
    if t == "standings":
        return get_standings(w["competition"], w.get("highlight_team_ids"), w.get("top"))
    if t == "top_scorers":
        return get_top_scorers(w["competition"], "goals", 10)
    if t == "top_assists":
        return get_top_scorers(w["competition"], "assists", 10)
    raise ValueError(f"Unknown widget type: {t}")


# =============================================================================
# 7. Agent: tool specs, prompts, loop
# =============================================================================
def _spec(name: str, description: str, props: dict | None = None, required: list[str] | None = None) -> dict:
    return {
        "name": name,
        "description": description,
        "input_schema": {"type": "object", "properties": props or {}, "required": required or []},
    }


TOOL_SPECS = {
    "search": _spec(
        "search",
        "Search teams and competitions by name. Returns ids and competition codes. Always use this to find ids.",
        {"query": {"type": "string"}},
        ["query"],
    ),
    "list_available_stats": _spec(
        "list_available_stats",
        "List the stats this dashboard can show, and the ones that are not available.",
    ),
    "save_preferences": _spec(
        "save_preferences",
        "Save the user's dashboard preferences. Call once, after the user confirms.",
        {
            "teams": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {"id": {"type": "integer"}, "name": {"type": "string"}},
                    "required": ["id"],
                },
            },
            "competitions": {"type": "array", "items": {"type": "string"}},
            "stats": {"type": "array", "items": {"type": "string"}},
        },
        ["teams", "competitions", "stats"],
    ),
    "get_preferences": _spec("get_preferences", "Get the user's favorite teams, competitions, and chosen stats."),
    "get_next_match": _spec(
        "get_next_match", "Get a team's next scheduled match.", {"team_id": {"type": "integer"}}, ["team_id"]
    ),
    "get_recent_results": _spec(
        "get_recent_results",
        "Get a team's most recent finished matches with W/D/L outcome.",
        {"team_id": {"type": "integer"}, "n": {"type": "integer"}},
        ["team_id"],
    ),
    "get_standings": _spec(
        "get_standings",
        "Get the league table for a competition code such as 'PL'.",
        {"competition": {"type": "string"}},
        ["competition"],
    ),
    "get_top_scorers": _spec(
        "get_top_scorers",
        "Top scorers for a competition. sort_by 'assists' ranks assists among top scorers only.",
        {
            "competition": {"type": "string"},
            "sort_by": {"type": "string", "enum": ["goals", "assists"]},
            "limit": {"type": "integer"},
        },
        ["competition"],
    ),
}

TOOL_FUNCS = {
    "search": search,
    "list_available_stats": list_available_stats,
    "save_preferences": save_preferences,
    "get_preferences": get_preferences,
    "get_next_match": get_next_match,
    "get_recent_results": get_recent_results,
    "get_standings": lambda competition: get_standings(competition),
    "get_top_scorers": get_top_scorers,
}

MODE_TOOLS = {
    "onboarding": ["search", "list_available_stats", "save_preferences"],
    "assistant": [
        "search", "get_preferences", "list_available_stats", "get_next_match",
        "get_recent_results", "get_standings", "get_top_scorers",
    ],
}

SYSTEM_PROMPTS = {
    "onboarding": """You are a friendly assistant setting up a personalized sports dashboard.
Goal: learn which teams, leagues/competitions, and stats the user cares about, then save them.

Rules:
- Ask only one or two questions at a time, in this order: teams, then leagues, then stats.
- Use the search tool to find teams and competitions. Never guess ids or codes.
  If search finds nothing, say so and ask for another spelling.
- Only offer stats that list_available_stats says are available. If the user asks for an
  unavailable stat (e.g. possession), say plainly that it isn't available and suggest the closest alternatives.
- Before saving, summarize the choices and ask the user to confirm.
- After they confirm, call save_preferences once, then tell them their dashboard is ready.
- Keep replies short and warm. Don't mention tools or ids to the user.""",
    "assistant": """You are a concise sports assistant inside a personal dashboard.
- Answer ONLY from tool results. If the data isn't available, say so plainly. Never guess scores or stats.
- If the question is ambiguous, assume the user's favorites (call get_preferences).
- Use search to find ids for any team or competition outside the favorites.
- Free-tier scores can be delayed, and some stats (possession, lineups, cards) aren't available. Say so when relevant.
- Keep answers short and easy to scan.""",
}


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    mode: Literal["onboarding", "assistant"] = "assistant"
    messages: list[ChatMessage]


ENABLE_AI = os.environ.get("ENABLE_AI", "").lower() == "true"
client = anthropic.Anthropic() if ENABLE_AI else None // makes the ai client optional


def run_agent(mode: str, history: list[ChatMessage]) -> tuple[str, bool]:
    tools = [TOOL_SPECS[n] for n in MODE_TOOLS[mode]]
    messages = [m.model_dump() for m in history][-20:]
    while messages and messages[0]["role"] != "user":
        messages.pop(0)
    if not messages:
        return "Say hi to get started!", False

    dashboard_updated = False
    for _ in range(8):  # cap the tool-use loop
        resp = client.messages.create(
            model=MODEL,
            max_tokens=1000,
            system=SYSTEM_PROMPTS[mode],
            tools=tools,
            messages=messages,
        )
        if resp.stop_reason != "tool_use":
            return "".join(b.text for b in resp.content if b.type == "text"), dashboard_updated

        messages.append({"role": "assistant", "content": resp.content})
        results = []
        for block in resp.content:
            if block.type != "tool_use":
                continue
            try:
                if block.name not in MODE_TOOLS[mode]:
                    raise ValueError("Tool not available in this mode")
                out = TOOL_FUNCS[block.name](**block.input)
                if block.name == "save_preferences" and out.get("saved"):
                    dashboard_updated = True
            except Exception as e:  # send errors back so the model can recover
                out = {"error": str(e)}
            results.append({"type": "tool_result", "tool_use_id": block.id, "content": json.dumps(out)})
        messages.append({"role": "user", "content": results})

    return "Sorry, I couldn't finish that request.", dashboard_updated


# =============================================================================
# 8. FastAPI app
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=load_index, daemon=True).start()  # don't block startup
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/api/preferences")
def api_get_preferences():
    return {"preferences": load_prefs()}


@app.delete("/api/preferences")
def api_reset_preferences():
    PREFS_PATH.unlink(missing_ok=True)
    return {"ok": True}


@app.get("/api/dashboard")
def api_dashboard():
    prefs = load_prefs()
    if not prefs:
        return {"onboarded": False}
    return {"onboarded": True, "preferences": prefs, "widgets": build_widgets(prefs)}


@app.post("/api/widget-data")
def api_widget_data(widget: dict):
    try:
        return {"id": widget.get("id"), "data": widget_data(widget)}
    except Exception as e:
        return {"id": widget.get("id"), "error": str(e)}


@app.get("/api/search")
def api_search(q: str = ""):
    return search(q)

@app.get("/api/competitions")
def api_competitions():
    return {"competitions": _index["competitions"]}


@app.get("/api/stats")
def api_stats():
    return list_available_stats()

@app.get("/api/team/{team_id}")
def api_team(team_id: int):
    try:
        return {
            "next_match": get_next_match(team_id),
            "recent_results": get_recent_results(team_id, 5),
        }
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/competition/{code}")
def api_competition(code: str):
    try:
        return {
            "standings": get_standings(code),
            "top_scorers": get_top_scorers(code, "goals", 10),
        }
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/api/chat")
def api_chat(req: ChatRequest):
    answer, updated = run_agent(req.mode, req.messages)
    return {"answer": answer, "dashboard_updated": updated}
