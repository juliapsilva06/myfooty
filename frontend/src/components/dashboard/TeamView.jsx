import { Fragment } from "react";
import { usePreferences } from "../../context/PreferencesContext.jsx";
import HeroCard from "./HeroCard.jsx";
import LeadersCard from "./LeadersCard.jsx";
import WidgetCard from "./WidgetCard.jsx";

// The standings widget from the backend is trimmed to the top rows. Here we ask for the full
// table instead, so the Top 5 / Around me / Full toggle works without another request.
// The id has no team in it, so every team shares the same cached table.
function fullTable(widget, team) {
  return {
    ...widget,
    id: `${widget.id}:full`,
    highlight_team_ids: team ? [team.id] : [],
    top: undefined, // dropped when sent: the backend then returns every row
  };
}

// One team (or, with no followed teams, just the competitions): hero, form, table, leaders.
export default function TeamView({ team, groups }) {
  const { accentOf } = usePreferences();
  const accent = team ? accentOf(team.id) : null;
  const mine = team ? groups.byTeam[team.id] ?? {} : {};

  return (
    <section className="view view-fade" style={accent ? { "--team-accent": accent } : undefined}>
      <h2 className="view-title display">{team ? team.name : "Your competitions"}</h2>

      {team && mine.next && <HeroCard widget={mine.next} team={team} accent={accent} />}

      <div className="view-grid">
        {team && mine.recent && (
          <WidgetCard
            widget={mine.recent}
            title="Recent form"
            askPrompt={`How has ${team.name} been playing lately?`}
          />
        )}
        {groups.competitions.map((c) => (
          <Fragment key={c.code}>
            {c.standings && (
              <WidgetCard
                widget={fullTable(c.standings, team)}
                title="Table"
                meta={c.code}
                askPrompt={
                  team
                    ? `Where are ${team.name} in the ${c.code} table, and who are they closest to?`
                    : `Who is top of the ${c.code} table?`
                }
              />
            )}
            {(c.scorers || c.assists) && (
              <LeadersCard
                competition={c.code}
                scorers={c.scorers}
                assists={c.assists}
                teamName={team?.name}
                askPrompt={`Who leads the ${c.code} for goals and assists?`}
              />
            )}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
