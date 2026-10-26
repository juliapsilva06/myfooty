// The backend sends one flat list of widgets. The dashboard needs them grouped:
// per team (next match, recent form) and per competition (table, scorers, assists).
// Unknown widget types are ignored, so a new backend widget never breaks the page.
export function groupWidgets(widgets = []) {
  const byTeam = {};
  const byCompetition = {};

  for (const w of widgets) {
    if (w.team_id != null) {
      const group = (byTeam[w.team_id] ??= {});
      if (w.type === "next_match") group.next = w;
      if (w.type === "recent_results") group.recent = w;
    } else if (w.competition) {
      const group = (byCompetition[w.competition] ??= { code: w.competition });
      if (w.type === "standings") group.standings = w;
      if (w.type === "top_scorers") group.scorers = w;
      if (w.type === "top_assists") group.assists = w;
    }
  }

  return { byTeam, competitions: Object.values(byCompetition) };
}
