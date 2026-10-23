import { api as mockApi } from "../mocks/mockApi.js";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json();
}

// Real API: matches the endpoints in backend_v2.py
const realApi = {
  getDashboard: () => request("/api/dashboard"),

  // Returns { id, data } or { id, error }
  getWidgetData: (widget) =>
    request("/api/widget-data", { method: "POST", body: JSON.stringify(widget) }),

  search: (q) => request(`/api/search?q=${encodeURIComponent(q)}`),
  getTeam: (id) => request(`/api/team/${id}`),
  getCompetition: (code) => request(`/api/competition/${encodeURIComponent(code)}`),

  // Returns { answer, dashboard_updated }
  chat: (mode, messages) =>
    request("/api/chat", { method: "POST", body: JSON.stringify({ mode, messages }) }),

  getPreferences: () => request("/api/preferences"),
  resetPreferences: () => request("/api/preferences", { method: "DELETE" }),
};

// Every component imports `api` from here and never knows which one it got.
export const api = USE_MOCK ? mockApi : realApi;
