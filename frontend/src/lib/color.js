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

function hexToHsl(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h, s, l) {
  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  return "#" + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function mix(hex, targetHex, amount) {
  const channel = (h, i) => parseInt(h.slice(i, i + 2), 16);
  return (
    "#" +
    [1, 3, 5]
      .map((i) => Math.round(channel(hex, i) * (1 - amount) + channel(targetHex, i) * amount).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

// Keeps a team color visible against the page. A color that is too close to the background
// (navy on the dark theme, pale yellow on the light theme) is lightened or darkened until it
// reaches the minimum contrast. Colors that already work are returned unchanged.
//   Vivid colors keep their hue (a blue stays a blue).
//   Near-neutral colors (white, grey) are blended toward plain black or white, so they stay neutral
//   instead of picking up a color tint.
export function ensureContrast(hex, backgroundHex, min = 3) {
  if (contrastRatio(hex, backgroundHex) >= min) return { hex, adjusted: false };

  const [h, s, l] = hexToHsl(hex);
  const lighten = luminance(backgroundHex) < 0.5; // dark page: go lighter. Light page: go darker.
  const target = lighten ? "#FFFFFF" : "#000000";
  const neutral = s < 0.35;

  for (let i = 1; i <= 40; i++) {
    const candidate = neutral
      ? mix(hex, target, i * 0.025)
      : hslToHex(h, s, lighten ? Math.min(1, l + i * 0.025) : Math.max(0, l - i * 0.025));
    if (contrastRatio(candidate, backgroundHex) >= min) return { hex: candidate, adjusted: true };
  }
  return { hex: target, adjusted: true };
}
