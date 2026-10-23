import { readableOn } from "../../lib/color.js";

// A circle with a team's three-letter code.
// Followed teams are filled with their accent color; everyone else is neutral.
export default function Monogram({ code, size = "md", accent = null }) {
  const style = accent ? { background: accent, borderColor: accent, color: readableOn(accent) } : undefined;
  // aria-hidden: the full team name is always written next to it, so this is decoration.
  return (
    <span className={`monogram monogram--${size}`} style={style} aria-hidden="true">
      {code}
    </span>
  );
}
