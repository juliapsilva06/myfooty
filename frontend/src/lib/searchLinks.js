import { SEARCH_PROVIDER } from "../config/features.js";

// Links that connect a number on the dashboard to what actually happened on the pitch.
const ENGINES = {
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  youtube: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
};
const searchUrl = (query) => (ENGINES[SEARCH_PROVIDER] ?? ENGINES.google)(query);

// "Lamine Yamal FC Barcelona goals highlights"
export function playerHighlightsUrl(player, team, stat) {
  const word = stat === "assists" ? "assists" : "goals";
  return searchUrl([player, team, word, "highlights"].filter(Boolean).join(" "));
}

// "FC Barcelona vs Real Madrid CF highlights 2026"
export function matchHighlightsUrl(match) {
  const year = new Date(match.date).getFullYear();
  const parts = [match.home, "vs", match.away, "highlights", Number.isNaN(year) ? "" : year];
  return searchUrl(parts.filter(Boolean).join(" "));
}
