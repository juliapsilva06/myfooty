import { storage } from "./storage.js";

const KEY = "prefs";

// A visitor's choices (teams, leagues, stats). They live in this browser only,
// so one visitor never sees or changes another's dashboard.
export function loadPrefs() {
  const raw = storage.get(KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (!Array.isArray(p?.teams) || !Array.isArray(p?.competitions) || !Array.isArray(p?.stats)) return null;
    return {
      teams: p.teams
        .filter((t) => t && Number.isFinite(t.id) && typeof t.name === "string")
        .map((t) => ({ id: t.id, name: t.name, ...(typeof t.tla === "string" && t.tla ? { tla: t.tla } : {}) })),
      competitions: p.competitions.filter((c) => typeof c === "string"),
      stats: p.stats.filter((s) => typeof s === "string"),
    };
  } catch {
    return null; // damaged data: start fresh
  }
}

// Returns true when saved, false when the browser refused.
export function savePrefs(prefs) {
  const clean = {
    teams: prefs.teams.map((t) => ({ id: t.id, name: t.name, ...(typeof t.tla === "string" && t.tla ? { tla: t.tla } : {}) })),
    competitions: [...prefs.competitions],
    stats: [...prefs.stats],
  };
  return storage.set(KEY, JSON.stringify(clean));
}

export function clearPrefs() {
  storage.remove(KEY);
}
