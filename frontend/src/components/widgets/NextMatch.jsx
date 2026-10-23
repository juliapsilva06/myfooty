import { formatMatchDate } from "../../lib/formatDate.js";

export default function NextMatch({ data }) {
  if (!data || data.info) {
    return <p className="muted">{data?.info ?? "No upcoming match found."}</p>;
  }
  return (
    <div className="next-match">
      <div className="next-match__teams">
        <span>{data.home}</span>
        <span className="muted">vs</span>
        <span>{data.away}</span>
      </div>
      <p className="muted">{formatMatchDate(data.date)}</p>
      <p className="muted small">{data.competition}</p>
    </div>
  );
}
