# footyhaus

# Footy Haus

A personal football dashboard. It shows only the teams and leagues you follow, and an AI assistant answers questions using live data (demo).

Most sports apps show far too much at once. Footy Haus starts with a short chat that learns your teams, leagues, and favorite stats, then builds a dashboard around them: next match with a live countdown, recent form, the league table around your team, and top scorers and assists.


## Features

- **Personalized setup.** User chooses which teams, leagues, and stats they care about. The website saves their choices.
- **Team picker.** Switch between your teams, or open "All teams" for a quick overview of each (and only the teams you follow).
- **Next-match hero.** A live countdown, kickoff time in your local time zone, and home or away.
- **Recent form.** Win, draw, and loss chips with scorelines from your team's point of view. Tap a chip for match details.
- **League table with views.** Top 5, around your team, or the full table.
- **Leaders.** Top scorers and assists with a toggle.
- **"Ask about this" buttons** on each card open the assistant with a ready-made question.
- **Assistant chat.** Answers come from tool calls to the same data as the dashboard, and it says so when something isn't available.
- **Themes.** Dark by default, with light and "match my device" options.
- **Sample-data mode.** The whole interface runs without a backend or API keys.

## How it works

```
Browser (React)  ──►  Backend (FastAPI)  ──►  football-data.org   (matches, tables, scorers)
                              │
                              └──────────►  Claude API            (the assistant, demo)
```

- The **backend** keeps both API keys private, caches sports data, builds a local search index, and runs the AI agent.
- The **agent** has two modes. In onboarding mode it can only search teams and save preferences. In assistant mode it can look up fixtures, results, tables, and scorers. It never designs the page: your saved preferences are turned into a widget list by plain Python.
- The **frontend** renders that widget list. Each card loads its own data, so one slow or failing card doesn't block the others.

## Tech stack

| Part | Tools |
|---|---|
| Frontend | React, Vite, TanStack Query |
| Backend | Python, FastAPI, httpx |
| Sports data | [football-data.org](https://www.football-data.org) (free tier) |
| AI | Anthropic Claude API with tool use |

## Project structure

```
myfooty/
├─ backend/
│  ├─ backend.py            FastAPI app: data client, search index, widgets, AI agent
│  ├─ requirements.txt      Python packages (see Setup)
│  ├─ .env                  API keys (do not commit)
└─ frontend/
   ├─ index.html
   ├─ public/               Images served as-is: logo.png, logo-light.png, hero.jpg, background.jpg
   ├─ .env                  VITE_USE_MOCK (sample data on or off)
   └─ src/
      ├─ api/               API client (real or mock)
      ├─ mocks/             Fake backend with fictional teams and players
      ├─ config/            appearance.js: site name, logos, hero style
      ├─ hooks/             Data and behavior (chat, theme, countdown, team selection)
      ├─ context/           Shared state (preferences, assistant)
      ├─ lib/               Small helpers (dates, colors, table views, grouping)
      ├─ components/        chat, common, dashboard, layout, onboarding, widgets
      └─ styles/            tokens, base, views, motion, identity, fonts
```

## Setup

The commands below are for Windows PowerShell. On macOS or Linux, use `source .venv/bin/activate` instead of the `Activate.ps1` line.

### What you need

- [Node.js](https://nodejs.org) (LTS version)
- Python 3
- A football-data.org API token (free account)
- An Anthropic API key, needed only for the assistant and the setup chat

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If you don't have a `requirements.txt` yet, create one containing:

```
fastapi
uvicorn
httpx
anthropic
python-dotenv
```

Create `backend/.env` (no quotes, no spaces around `=`):

```
FOOTBALL_DATA_TOKEN=your-football-data-token
ANTHROPIC_API_KEY=your-anthropic-key
```

Start it:

```powershell
python -m uvicorn backend:app --reload
```

It runs at `http://127.0.0.1:8000`, and the interactive API docs are at `/docs`. On first start it builds the search index in the background, which takes a minute or two because of the free tier's rate limit. Search returns nothing until that finishes.

### Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the address it prints (usually `http://localhost:5173`).

### Sample data or real data

`frontend/.env` controls this:

```
VITE_USE_MOCK=true    # fictional sample data, no backend needed
VITE_USE_MOCK=false   # talks to the real backend on port 8000
```

Restart `npm run dev` after changing it. Vite only reads this file at startup.

## Environment variables

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `FOOTBALL_DATA_TOKEN` | `backend/.env` | Yes | football-data.org access |
| `ANTHROPIC_API_KEY` | `backend/.env` | For the assistant | Claude API access |
| `CLAUDE_MODEL` | `backend/.env` | No | Model name; defaults to the one set in `backend.py` |
| `VITE_USE_MOCK` | `frontend/.env` | No | `true` for sample data |

Never put API keys in the frontend. Anything starting with `VITE_` is sent to the browser.

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/preferences` | Your saved teams, competitions, and stats |
| `DELETE /api/preferences` | Reset and run setup again |
| `GET /api/dashboard` | The widget layout built from your preferences |
| `POST /api/widget-data` | Data for one widget |
| `GET /api/search?q=` | Search teams and competitions |
| `GET /api/team/{id}` | Next match and recent results |
| `GET /api/competition/{code}` | Standings and top scorers |
| `POST /api/chat` | Talk to the agent: `{ mode: "onboarding" \| "assistant", messages: [...] }` |

## Customizing

| To change | Edit |
|---|---|
| Site name, logos, logo size, hero style | `frontend/src/config/appearance.js` |
| Logo and picture files | `frontend/public/` (`logo.png` for dark, `logo-light.png` for light, `hero.jpg`, `background.jpg`) |
| Fonts | `frontend/src/styles/fonts.css`, and each font must be installed (Fontsource) or loaded with a `<link>` tag |
| Colors, spacing, themes | `frontend/src/styles/tokens.css` |
| Team colors | `frontend/src/lib/accents.js` (colors are assigned by team order) |
| Picture strength behind text | `--hero-scrim` and `--page-scrim` in `frontend/src/styles/identity.css` |

## Data notes and limits

- The football-data.org free tier allows about 10 requests per minute and covers a limited set of competitions. Check their site for current limits. The backend caches responses (fixtures about an hour, results 30 minutes, tables and scorers 3 hours) to stay under the limit, so a first load can take a while.
- Free-tier scores are delayed, and live scores aren't available.
- Possession, shots, cards, and lineups aren't available on the free tier, and the setup chat only offers stats that are.
- "Assists" come from the scorers list, so they only cover the top scorers.
- Table views currently use the first standings group, which suits leagues but not group-stage cups.

## Before you deploy

- Keep both API keys on the server only. The assistant endpoint costs you money on every call, so add rate limits, a spending limit on your Anthropic key, and a smaller model if needed.
- If you'd rather not pay for visitors' questions, a "bring your own key" setup can let each visitor use their own Anthropic API key. Anthropic doesn't permit apps to route requests through Claude.ai subscription logins, so it has to be an API key.
- Make sure `.env`, `backend/prefs.json`, and `backend/search_index.json` are in `.gitignore`.
- Preferences are stored in one file, so this is a single-user app until you add accounts.
- Serve the site over HTTPS, and check football-data.org's terms for any attribution or usage rules on a public site.

## Troubleshooting

| Problem | Fix |
|---|---|
| `uvicorn` is not recognized | Activate the virtual environment, or run `python -m uvicorn backend:app --reload` |
| `No module named backend` | Run the command from inside the `backend` folder |
| `KeyError: 'FOOTBALL_DATA_TOKEN'` | The `.env` isn't loaded. Check the file name, its location in `backend/`, and that `load_dotenv()` runs before the keys are read |
| "Failed to resolve import" for a font | The package isn't installed or the import name is wrong. Check the files inside `node_modules/@fontsource...` |
| New file in `public/` doesn't load | Restart `npm run dev`, then test `http://localhost:5173/yourfile.png` directly |
| Real mode shows empty widgets or errors | Check the backend terminal for errors, and `http://127.0.0.1:8000/docs` for working endpoints |
| Search returns nothing | The search index is still building after startup; wait a minute |
| Scripts are disabled in PowerShell | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once |

## Roadmap

- [ ] Search bar and team and competition pages
- [ ] In-app team color picker
- [ ] Setup form that works without the AI
- [ ] "Updated 3 minutes ago" and a refresh button
- [ ] Chat docked beside the dashboard on wide screens
- [ ] Accounts, or bring-your-own-key for the assistant, before going public
- [ ] Choose a license

## Credits

Match data comes from [football-data.org](https://www.football-data.org). The assistant is powered by [Claude](https://www.anthropic.com).

