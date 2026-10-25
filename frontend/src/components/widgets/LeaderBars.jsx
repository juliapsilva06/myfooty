import { playerHighlightsUrl } from "../../lib/searchLinks.js";
import "../../styles/features.css";

// Top five players with a thin bar proportional to the stat.
// Players on the selected team get the full team color; everyone else a softer tint.
// Each name opens a search for that player's goals or assists, so you can watch what the number means.
export default function LeaderBars({ data, stat, teamName }) {
  const rows = (data ?? []).slice(0, 5);
  if (!rows.length) {
    return <p className="muted">No player data available yet.</p>;
  }
  const max = Math.max(...rows.map((r) => r[stat]), 1);
  const word = stat === "assists" ? "assists" : "goals";

  return (
    <ol className="leader-list">
      {rows.map((p, i) => (
        <li
          key={`${stat}-${p.player}-${p.team}`}
          className={teamName && p.team === teamName ? "leader leader--mine" : "leader"}
        >
          <span className="rank num">{i + 1}</span>
          <span className="leader__who">
            <strong>
              <a
                className="player-link"
                href={playerHighlightsUrl(p.player, p.team, stat)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Search for ${p.player} ${word} highlights`}
              >
                {p.player}
                <span className="sr-only"> (opens a search in a new tab)</span>
              </a>
            </strong>
            <span className="muted small">{p.team}</span>
          </span>
          <span className="leader__stat display">{p[stat]}</span>
          <span className="leader__bar" aria-hidden="true">
            <span className="leader__fill" style={{ "--v": p[stat] / max }} />
          </span>
        </li>
      ))}
    </ol>
  );
}
