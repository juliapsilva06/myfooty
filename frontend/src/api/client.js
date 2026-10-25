import { api as mockApi } from "../mocks/mockApi.js";
import { buildWidgets } from "../lib/buildWidgets.js";
import { clearPrefs, loadPrefs, savePrefs } from "../lib/prefsStore.js";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// Local development uses the Vite proxy (empty string). When the frontend and backend are
// deployed on different addresses, set VITE_API_BASE to the backend's address.
const BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json();
}

// Data that comes from the backend: matches, tables, scorers, search, and the assistant.
const realApi = {
  // Returns { id, data } or { id, error }
  getWidgetData: (widget) =>
    request("/api/widget-data", { method: "POST", body: JSON.stringify(widget) }),

  search: (q) => request(`/api/search?q=${encodeURIComponent(q)}`),
  getCompetitions: () => request("/api/competitions"),
  getStats: () => request("/api/stats"),
  getTeam: (id) => request(`/api/team/${id}`),
  getCompetition: (code) => request(`/api/competition/${encodeURIComponent(code)}`),

  // Returns { answer, dashboard_updated }
  chat: (mode, messages) =>
    request("/api/chat", { method: "POST", body: JSON.stringify({ mode, messages }) }),
};

// A visitor's choices live in their own browser (real and mock mode alike), so on a public
// site everyone gets their own dashboard and the server stores nothing about them.
const localApi = {
  async getDashboard() {
    const preferences = loadPrefs();
    if (!preferences) return { onboarded: false };
    return { onboarded: true, preferences, widgets: buildWidgets(preferences) };
  },
  async savePreferences(prefs) {
    return savePrefs(prefs); // true when saved
  },
  async resetPreferences() {
    clearPrefs();
    return { ok: true };
  },
};

// Every component imports `api` from here and never knows which pieces are real, mock, or local.
export const api = { ...(USE_MOCK ? mockApi : realApi), ...localApi };
