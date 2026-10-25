import { useState } from "react";
import { usePreferences } from "../../context/PreferencesContext.jsx";
import { formatMatchDate } from "../../lib/formatDate.js";
import { matchHighlightsUrl } from "../../lib/searchLinks.js";
import { initials } from "../../lib/teamCode.js";
import "../../styles/features.css";

const OUTCOME_WORD = { W: "Win", D: "Draw", L: "Loss" };

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
  return { key: m.date, match: m, outcome: m.outcome ?? null, score, opponent, code, atHome };
}

export default function RecentResults({ widget, data }) {
  const { teams, accentOf } = usePreferences();
  const [openKey, setOpenKey] = useState(null); // which chip's details are showing
  if (!data?.length) {
    return <p className="muted">No results yet. They'll appear after the first match.</p>;
  }

  const team = teams.find((t) => t.id === widget.team_id);
  const rows = data.map((m) => fromTeamView(m, widget.team_id, team?.name));
  const accent = accentOf(widget.team_id);
  const newestFirst = [...rows].reverse();
  const open = rows.find((r) => r.key === openKey);

  return (
    <div style={accent ? { "--team-accent": accent } : undefined}>
      {/* Oldest to newest, so the latest result sits on the right and is emphasized. */}
      <ul className="form-strip" aria-label="Last results, oldest to newest">
        {rows.map((r, i) => (
          <li
            key={r.key}
            className={`form-item${i === rows.length - 1 ? " form-item--latest" : ""}`}
            style={{ "--i": i }}
          >
            <button
              type="button"
              className="form-item__btn"
              aria-pressed={openKey === r.key}
              aria-label={`${OUTCOME_WORD[r.outcome] ?? "Result"}: ${r.score ?? "no score"} against ${r.opponent}, ${r.atHome ? "home" : "away"}`}
              onClick={() => setOpenKey(openKey === r.key ? null : r.key)}
            >
              <span className={`chip chip-${r.outcome ?? "none"}`}>{r.outcome ?? "-"}</span>
              <span className="form-item__score num">{r.score ?? "-"}</span>
              <span className="form-item__opp">{r.code}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Stays in the page so screen readers announce changes; hidden by CSS while empty. */}
      <div className="form-detail" aria-live="polite">
        {open && (
          <>
            <p>
              <strong>
                {open.match.home} {open.match.score?.replace("-", "–")} {open.match.away}
              </strong>
            </p>
            <p className="muted small">
              {formatMatchDate(open.match.date)}, {open.match.competition}
            </p>
            <p className="small">
              <a
                className="player-link"
                href={matchHighlightsUrl(open.match)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Search for highlights
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
          </>
        )}
      </div>

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
