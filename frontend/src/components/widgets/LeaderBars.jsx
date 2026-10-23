// Top five players with a thin bar proportional to the stat.
// Players on the selected team get the full team color; everyone else a softer tint.
export default function LeaderBars({ data, stat, teamName }) {
  const rows = (data ?? []).slice(0, 5);
  if (!rows.length) {
    return <p className="muted">No player data available yet.</p>;
  }
  const max = Math.max(...rows.map((r) => r[stat]), 1);

  return (
    <ol className="leader-list">
      {rows.map((p, i) => (
        <li
          key={`${stat}-${p.player}-${p.team}`}
          className={teamName && p.team === teamName ? "leader leader--mine" : "leader"}
        >
          <span className="rank num">{i + 1}</span>
          <span className="leader__who">
            <strong>{p.player}</strong>
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
