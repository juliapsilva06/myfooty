import { useAssistant } from "../../context/AssistantContext.jsx";
import { useWidgetData } from "../../hooks/useWidgetData.js";
import { HERO_STYLE } from "../../config/appearance.js";
import { readableOn } from "../../lib/color.js";
import NextMatch from "../widgets/NextMatch.jsx";

// The next-match hero: a solid block of the team's color with faint kit stripes.
// The only loud element on the page, so everything else can stay quiet.
export default function HeroCard({ widget, team, accent }) {
  const { data, isLoading, isError, refetch, isFetching } = useWidgetData(widget);
  const { ask } = useAssistant();

  // "photo": a dark picture with white text, and the team color kept as a small accent.
  // "color": a solid block of the team color; text is whichever of near-black or white
  //          has more contrast with it.
  const photo = HERO_STYLE === "photo";
  const style = photo
    ? { "--hero-bg": "#0D1411", "--hero-fg": "#FFFFFF", "--team-accent": accent, "--on-accent": readableOn(accent) }
    : { "--hero-bg": accent, "--hero-fg": readableOn(accent) };

  return (
    <section className={`hero${photo ? " hero--photo" : ""}`} style={style} aria-label={`${team.name}: next match`}>
      <button className="hero__ask" onClick={() => ask(`Tell me about ${team.name}'s next match.`)}>
        Ask about this
      </button>
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
