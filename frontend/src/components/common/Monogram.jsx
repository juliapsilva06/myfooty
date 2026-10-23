import { readableOn } from "../../lib/color.js";

// A circle with a team's three-letter code.
//   default: filled with `accent` for followed teams, neutral grey for everyone else
//   invert / ghost: for sitting on a filled color block (the hero), driven by CSS variables
export default function Monogram({ code, size = "md", accent = null, tone = "default" }) {
  const style =
    tone === "default" && accent
      ? { background: accent, borderColor: accent, color: readableOn(accent) }
      : undefined;
  // aria-hidden: the full team name is always written next to it, so this is decoration.
  return (
    <span className={`monogram monogram--${size} monogram--${tone}`} style={style} aria-hidden="true">
      {code}
    </span>
  );
}
