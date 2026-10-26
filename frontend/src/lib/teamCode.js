// Fallback three-letter code when the backend doesn't send one: "Riverside FC" -> "RIV".
export function initials(name = "") {
  const letters = name.replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, "");
  return letters.slice(0, 3).toUpperCase() || "?";
}
