// Is `team` the home side of this match? Uses team ids when the backend sends them,
// otherwise falls back to comparing names (never guesses "home" for a team that isn't).
export function isHomeFor(match, team) {
  if (match.home_id != null) return match.home_id === team.id;
  return match.home === team.name;
}
