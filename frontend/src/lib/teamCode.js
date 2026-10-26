// One code per followed team, used everywhere: the saved three-letter code, else initials.
export function teamCode(team) {
  return team?.tla || initials(team?.name ?? "");
}

// Fallback three-letter code when the backend doesn't send one: "Riverside FC" -> "RIV".
export function initials(name = "") {
  const letters = name.replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, "");
  return letters.slice(0, 3).toUpperCase() || "?";
}
