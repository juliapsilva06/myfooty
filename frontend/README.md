# Sports Dashboard Frontend

React + Vite frontend for the personalized sports dashboard. Matches the API in `backend_v2.py`.

## Run it (mock mode, no backend or API keys needed)

```bash
npm install
npm install @fontsource-variable/archivo   # font used by the visual redesign
npm run dev
```

Open the link Vite prints (usually http://localhost:5173).

You will see a dashboard of **fictional** teams and players. About 1 in 10 widget loads fails on purpose
so you can see the error and retry state. Click **Edit my dashboard** to run the scripted onboarding chat,
and **Ask** to open the assistant panel.

## Switch to the real backend

1. Start the backend: `uvicorn backend_v2:app --reload` (port 8000)
2. In `.env`, set `VITE_USE_MOCK=false`
3. Restart `npm run dev`. Vite proxies `/api` to port 8000 (see `vite.config.js`).

## Where things live

```
src/
  api/client.js            real fetch calls, plus the mock switch
  mocks/mockApi.js         fake backend (same response shapes as the real one)
  hooks/                   useDashboard, useWidgetData, useChat
  components/
    widgets/               one component per widget type + registry.js
    dashboard/             Dashboard (grid) and WidgetCard (loading/error/empty)
    layout/AppShell.jsx    header + dashboard
    onboarding/            onboarding chat screen
    chat/                  MessageList, MessageInput, ChatPanel (assistant slide-over)
  styles/tokens.css        colors, spacing, fonts (light + dark)
```

## Add a new widget type

1. Write the component in `src/components/widgets/` (props: `widget`, `data`; no fetching inside).
2. Register it in `src/components/widgets/registry.js`.
3. Add the type to `build_widgets()` / `widget_data()` in the backend (and to `mockApi.js` for mock mode).

## Status

- [x] Phase 0: setup, tokens
- [x] Phase 1: mock API, client switch, app shell, onboarding/dashboard switch
- [x] Phase 2: widgets, registry, loading/error states, responsive grid
- [x] Phase 3: onboarding chat + assistant panel
- [x] Visual Phase A: dark/light/system theme, Archivo font, monograms, restyled table, form, and next match
- [ ] Visual Phase B: team picker, "All teams" view, filled hero, merged leaders
- [ ] Visual Phase C: team color picker, chat polish, motion
- [ ] Phase 4: search bar + detail views
