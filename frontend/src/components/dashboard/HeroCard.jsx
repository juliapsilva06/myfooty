import { useAssistant } from "../../context/AssistantContext.jsx";
import { HERO_STYLE } from "../../config/appearance.js";
import { HERO_DEFAULT_IMAGE, HERO_SCRIM } from "../../config/features.js";
import { useHeroImage } from "../../hooks/useHeroImage.js";
import { useWidgetData } from "../../hooks/useWidgetData.js";
import { readableOn } from "../../lib/color.js";
import NextMatch from "../widgets/NextMatch.jsx";
import HeroBackgroundMenu from "./HeroBackgroundMenu.jsx";

// The next-match hero. In "photo" mode the visitor can set their own picture of the team
// behind the countdown (kept in their browser); in "color" mode it's a block of the team color.
export default function HeroCard({ widget, team, accent }) {
  const { data, isLoading, isError, refetch, isFetching } = useWidgetData(widget);
  const { ask, enabled } = useAssistant();
  const { image, error, setFromFile, setFromUrl, clear } = useHeroImage(team.id);

  const photo = HERO_STYLE === "photo";
  let style;
  if (photo) {
    const backdrop = image ?? HERO_DEFAULT_IMAGE;
    const scrim = `rgba(8, 12, 10, ${HERO_SCRIM})`;
    style = {
      "--hero-bg": "#0D1411",
      "--hero-fg": "#FFFFFF",
      "--team-accent": accent,
      "--on-accent": readableOn(accent),
      // Inline, so it always applies. Dark tint on top keeps the white text readable.
      backgroundColor: "#0D1411",
      backgroundImage: backdrop
        ? `linear-gradient(${scrim}, ${scrim}), url("${backdrop}")`
        : `linear-gradient(${scrim}, ${scrim})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  } else {
    // A solid block of the team color; text is whichever of near-black or white contrasts more.
    style = { "--hero-bg": accent, "--hero-fg": readableOn(accent) };
  }

  return (
    <section className={`hero${photo ? " hero--photo" : ""}`} style={style} aria-label={`${team.name}: next match`}>
      {photo && (
        <HeroBackgroundMenu
          hasImage={Boolean(image)}
          error={error}
          onFile={setFromFile}
          onUrl={setFromUrl}
          onClear={clear}
        />
      )}
      {enabled && (
        <button className="hero__ask" onClick={() => ask(`Tell me about ${team.name}'s next match.`)}>
          Ask about this
        </button>
      )}
      {isLoading ? (
        <div className="hero__loading" aria-busy="true" aria-label="Loading next match">
          <div className="skeleton-line" style={{ width: "60%" }} />
          <div className="skeleton-line" style={{ width: "85%" }} />
          <div className="skeleton-line" style={{ width: "40%" }} />
        </div>
      ) : isError ? (
        <div className="hero__error" role="alert">
          <p>Couldn't load the next match. The data service may be busy, so try again in a moment.</p>
          <button className="hero__retry" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Retrying..." : "Try again"}
          </button>
        </div>
      ) : (
        <NextMatch widget={widget} data={data} />
      )}
    </section>
  );
}
