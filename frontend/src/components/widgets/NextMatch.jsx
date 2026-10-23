import { formatMatchDate, relativeDay } from "../../lib/formatDate.js";
import { formatCountdown } from "../../lib/formatCountdown.js";
import { initials } from "../../lib/teamCode.js";
import { useCountdown } from "../../hooks/useCountdown.js";
import { usePreferences } from "../../context/PreferencesContext.jsx";
import Monogram from "../common/Monogram.jsx";

function Side({ name, id, tla }) {
  const { followedTeam } = usePreferences();
  const followed = followedTeam({ id, name });
  // On the colored hero: your team is inverted, opponents are a translucent ghost.
  return (
    <div className="hero__side">
      <Monogram code={tla || initials(name)} size="lg" tone={followed ? "invert" : "ghost"} />
      <span className="hero__name display">{name}</span>
    </div>
  );
}

// The inside of the hero. HeroCard supplies the colored frame and loading/error states.
export default function NextMatch({ widget, data }) {
  const { teams } = usePreferences();
  const count = useCountdown(data?.date); // hooks run before any early return

  if (!data || data.info) {
    return (
      <p className="hero__empty">
        {data?.info ?? "No fixtures scheduled yet. The next one will show here when it's announced."}
      </p>
    );
  }

  const team = teams.find((t) => t.id === widget.team_id);
  const atHome = data.home_id != null ? data.home_id === widget.team_id : data.home === team?.name;
  const venue = team ? (atHome ? "at home" : "away") : "";
  const when = relativeDay(data.date);

  let countText;
  if (!count.valid) countText = when.label;
  else if (count.done) countText = when.days === 0 ? "Kicking off now" : "Result pending";
  else countText = formatCountdown(count);

  return (
    <div className="hero__body">
      <div className="hero__matchup">
        <Side name={data.home} id={data.home_id} tla={data.home_tla} />
        <span className="hero__vs">vs</span>
        <Side name={data.away} id={data.away_id} tla={data.away_tla} />
      </div>
      <div className="hero__when">
        <p className="hero__count display">
          {count.valid && !count.done && <span className="sr-only">Kickoff in </span>}
          {countText}
        </p>
        <p className="hero__date">
          <time dateTime={data.date}>{formatMatchDate(data.date)}</time>
          {venue && `, ${venue}`}
        </p>
        <p className="hero__comp">{data.competition}</p>
      </div>
    </div>
  );
}
