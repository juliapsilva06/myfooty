import { usePreferences } from "../../context/PreferencesContext.jsx";
import { initials } from "../../lib/teamCode.js";

// Rewrites a match from the followed team's point of view:
// "Westport Rangers 0-2 Riverside FC" becomes "W 2–0 Westport Rangers (A)".
function fromTeamView(m, teamId, teamName) {
  const atHome = m.home_id != null ? m.home_id === teamId : m.home === teamName;
  const opponent = atHome ? m.away : m.home;
  const code = (atHome ? m.away_tla : m.home_tla) || initials(opponent);
  let score = null;
  if (m.score) {
    const [h, a] = m.score.split("-");
    score = atHome ? `${h}–${a}` : `${a}–${h}`; // own goals first
  }
  return { key: m.date, outcome: m.outcome ?? null, score, opponent, code, atHome };
}

export default function RecentResults({ widget, data }) {
  const { teams, accentOf } = usePreferences();
  if (!data?.length) {
    return <p className="muted">No results yet. They'll appear after the first match.</p>;
  }

  const team = teams.find((t) => t.id === widget.team_id);
  const rows = data.map((m) => fromTeamView(m, widget.team_id, team?.name));
  const accent = accentOf(widget.team_id);
  const newestFirst = [...rows].reverse();

  return (
    <div style={accent ? { "--team-accent": accent } : undefined}>
      {/* Oldest to newest, so the latest result sits on the right and is emphasized. */}
      <ul className="form-strip" aria-label="Last results, oldest to newest">
        {rows.map((r, i) => (
          <li key={r.key} className={`form-item${i === rows.length - 1 ? " form-item--latest" : ""}`}>
            <span className={`chip chip-${r.outcome ?? "none"}`}>{r.outcome ?? "-"}</span>
            <span className="form-item__score num">{r.score ?? "-"}</span>
            <span className="form-item__opp">{r.code}</span>
          </li>
        ))}
      </ul>
      <ul className="result-list">
        {newestFirst.map((r) => (
          <li key={r.key}>
            <span className={`result-letter result-${r.outcome ?? "none"}`}>{r.outcome ?? "-"}</span>
            <strong className="num">{r.score ?? "-"}</strong>
            <span className="result-opp">
              {r.opponent} ({r.atHome ? "H" : "A"})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
