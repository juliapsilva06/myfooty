const DARK_TEXT = "#0D1411";
const LIGHT_TEXT = "#FFFFFF";

// Relative luminance of a "#rrggbb" color (0 = black, 1 = white).
function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG contrast ratio between two "#rrggbb" colors (1 to 21).
export function contrastRatio(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

// Text color for a filled background: whichever of near-black or white has more contrast.
export function readableOn(hex) {
  return contrastRatio(hex, DARK_TEXT) >= contrastRatio(hex, LIGHT_TEXT) ? DARK_TEXT : LIGHT_TEXT;
}
