// Turns saved preferences into the list of cards on the dashboard.
// Runs in the browser, so every visitor gets their own dashboard and the server stores nothing.
export function buildWidgets(prefs) {
  const stats = new Set(prefs.stats?.length ? prefs.stats : ["form", "standings"]);
  const teamIds = prefs.teams.map((t) => t.id);
  const widgets = [];

  for (const t of prefs.teams) {
    widgets.push({ id: `next_match:${t.id}`, type: "next_match", team_id: t.id, title: `${t.name}: next match` });
    if (stats.has("form")) {
      widgets.push({ id: `recent_results:${t.id}`, type: "recent_results", team_id: t.id, n: 5, title: `${t.name}: recent form` });
    }
  }
  for (const code of prefs.competitions) {
    if (stats.has("standings")) {
      widgets.push({ id: `standings:${code}`, type: "standings", competition: code, highlight_team_ids: teamIds, top: 5, title: `${code}: table` });
    }
    if (stats.has("goals")) {
      widgets.push({ id: `top_scorers:${code}`, type: "top_scorers", competition: code, title: `${code}: top scorers` });
    }
    if (stats.has("assists")) {
      widgets.push({ id: `top_assists:${code}`, type: "top_assists", competition: code, title: `${code}: assists among top scorers` });
    }
  }
  return widgets;
}
