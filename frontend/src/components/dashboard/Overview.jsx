import { usePreferences } from "../../context/PreferencesContext.jsx";
import { useWidgetData } from "../../hooks/useWidgetData.js";
import { relativeDay } from "../../lib/formatDate.js";
import { initials } from "../../lib/teamCode.js";
import Monogram from "../common/Monogram.jsx";

const NONE = { id: "none" }; // placeholder so hooks can run when a widget is missing

function nextLine(query, teamId) {
  if (query.isLoading) return "Loading next match...";
  if (query.isError) return "Couldn't load the next match";
  const m = query.data;
  if (!m || m.info) return m?.info ?? "No fixture scheduled";
  const atHome = m.home_id != null ? m.home_id === teamId : true;
  const opponent = atHome ? m.away : m.home;
  return `Next: ${atHome ? "vs" : "at"} ${opponent}, ${relativeDay(m.date).label.toLowerCase()}`;
}

function OverviewRow({ team, widgets, onOpen }) {
  const { accentOf } = usePreferences();
  const accent = accentOf(team.id);
  const next = useWidgetData(widgets.next ?? NONE, { enabled: Boolean(widgets.next) });
  const recent = useWidgetData(widgets.recent ?? NONE, { enabled: Boolean(widgets.recent) });

  const m = next.data;
  const code =
    (m && m.home_id === team.id ? m.home_tla : m && m.away_id === team.id ? m.away_tla : null) ||
    initials(team.name);
  const form = recent.data ?? [];

  return (
    <button
      className="overview-row"
      style={{ "--team-accent": accent }}
      onClick={() => onOpen(team.id)}
      aria-label={`Open ${team.name}`}
    >
      <Monogram code={code} size="md" accent={accent} />
      <span className="overview-row__main">
        <strong className="overview-row__name">{team.name}</strong>
        <span className="muted small">{widgets.next ? nextLine(next, team.id) : "Next match not selected"}</span>
      </span>
      <span className="overview-row__form" aria-hidden="true">
        {form.map((r, i) => (
          <span key={r.date} className={`chip chip--sm chip-${r.outcome ?? "none"}`} style={{ "--i": i }}>
            {r.outcome ?? "-"}
          </span>
        ))}
      </span>
    </button>
  );
}

// "All teams": one calm row per team you follow (and nobody else).
export default function Overview({ teams, groups, onOpen }) {
  return (
    <section className="view view-fade" aria-labelledby="overview-title">
      <div>
        <h2 id="overview-title" className="view-title display">
          Your teams
        </h2>
        <p className="muted">Pick a team to see its next match, form, table, and leaders.</p>
      </div>
      <div className="overview-list">
        {teams.map((t) => (
          <OverviewRow key={t.id} team={t} widgets={groups.byTeam[t.id] ?? {}} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
