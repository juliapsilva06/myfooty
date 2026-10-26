// Chooses which table rows to show.
//   top:    the top 5, plus the user's team wherever it sits
//   around: five rows centered on the user's team (clamped at the top and bottom)
//   full:   everything
export function pickRows(rows, view, mineIds) {
  if (view === "full") return rows;

  const index = rows.findIndex((r) => mineIds.has(r.team_id));
  if (view === "around" && index !== -1) {
    const size = 5;
    const start = Math.max(0, Math.min(index - 2, rows.length - size));
    return rows.slice(start, start + size);
  }
  return rows.filter((r, i) => i < 5 || mineIds.has(r.team_id));
}
