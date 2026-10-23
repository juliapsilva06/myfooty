import { formatKickoff, relativeDay } from "../../lib/formatDate.js";
import { initials } from "../../lib/teamCode.js";
import { usePreferences } from "../../context/PreferencesContext.jsx";
import Monogram from "../common/Monogram.jsx";

function Side({ name, id, tla }) {
  const { followedTeam, accentOf } = usePreferences();
  const followed = followedTeam({ id, name });
  const accent = followed ? accentOf(followed.id) : null;
  return (
    <div className="matchup__side">
      <Monogram code={tla || initials(name)} size="lg" accent={accent} />
      <span className="matchup__name display">{name}</span>
    </div>
  );
}

// Phase A version. Phase B turns this into the filled, striped hero.
export default function NextMatch({ widget, data }) {
  const { teams } = usePreferences();
  if (!data || data.info) {
    return (
      <p className="muted">
        {data?.info ?? "No fixtures scheduled yet. The next one will show here when it's announced."}
      </p>
    );
  }

  const team = teams.find((t) => t.id === widget.team_id);
  const atHome = data.home_id != null ? data.home_id === widget.team_id : data.home === team?.name;
  const when = relativeDay(data.date);
  const kickoff = formatKickoff(data.date, when.days);
  const venue = team ? (atHome ? "at home" : "away") : "";

  return (
    <div className="next-match">
      <div className="matchup">
        <Side name={data.home} id={data.home_id} tla={data.home_tla} />
        <span className="matchup__vs muted">vs</span>
        <Side name={data.away} id={data.away_id} tla={data.away_tla} />
      </div>
      <div className="next-match__when">
        <p className="next-match__relative display">{when.label}</p>
        {(kickoff || venue) && <p className="muted">{[kickoff, venue].filter(Boolean).join(", ")}</p>}
        <p className="muted small">{data.competition}</p>
      </div>
    </div>
  );
}
