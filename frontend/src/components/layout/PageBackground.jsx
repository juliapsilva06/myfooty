import { useResolvedTheme } from "../../hooks/useResolvedTheme.js";
import { PAGE_BACKGROUND, PAGE_SCRIM } from "../../config/features.js";

// The picture behind the whole site. A fixed layer sitting behind everything, styled inline
// so it works no matter which stylesheets load. A tint on top keeps text readable.
export default function PageBackground() {
  const theme = useResolvedTheme();
  if (!PAGE_BACKGROUND) return null;
  const tint = theme === "light" ? `rgba(237, 240, 234, ${PAGE_SCRIM})` : `rgba(13, 20, 17, ${PAGE_SCRIM})`;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        backgroundImage: `linear-gradient(${tint}, ${tint}), url("${PAGE_BACKGROUND}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
}
