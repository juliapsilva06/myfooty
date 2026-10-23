export default function RecentResults({ data }) {
  if (!data?.length) {
    return <p className="muted">No recent results yet.</p>;
  }
  // The backend returns oldest first: chips read left to right (oldest to newest),
  // while the score list shows the newest match on top.
  const newestFirst = [...data].reverse();

  return (
    <>
      <div className="chips" aria-label="Form, oldest to newest">
        {data.map((m) => (
          <span
            key={m.date}
            className={`chip chip-${m.outcome ?? "none"}`}
            title={`${m.home} ${m.score ?? ""} ${m.away}`}
          >
            {m.outcome ?? "-"}
          </span>
        ))}
      </div>
      <ul className="result-list">
        {newestFirst.map((m) => (
          <li key={m.date}>
            <span>{m.home}</span>
            <strong>{m.score ?? "-"}</strong>
            <span>{m.away}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
