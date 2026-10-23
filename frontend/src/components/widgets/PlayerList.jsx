// Shared by TopScorers and TopAssists. Shows only the top 5 to keep the dashboard calm.
export default function PlayerList({ data, stat, note }) {
  if (!data?.length) {
    return <p className="muted">No player data available.</p>;
  }
  return (
    <>
      <ol className="player-list">
        {data.slice(0, 5).map((p, i) => (
          <li key={`${p.player}-${p.team}`}>
            <span className="rank">{i + 1}</span>
            <span className="player">
              <strong>{p.player}</strong>
              <span className="muted small">{p.team}</span>
            </span>
            <span className="stat">{p[stat]}</span>
          </li>
        ))}
      </ol>
      {note && <p className="muted small">{note}</p>}
    </>
  );
}
