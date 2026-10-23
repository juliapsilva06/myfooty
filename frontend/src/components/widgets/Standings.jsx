import { usePreferences } from "../../context/PreferencesContext.jsx";

const signed = (n) => (n > 0 ? `+${n}` : String(n));

export default function Standings({ widget, data }) {
  const { accentOf } = usePreferences();
  if (!data?.length) {
    return <p className="muted">No table available yet.</p>;
  }
  const highlighted = new Set(widget.highlight_team_ids ?? []);

  // The backend returns the top rows plus the user's teams, so positions can jump.
  // A dotted rule marks each jump.
  const rows = [];
  data.forEach((r, i) => {
    const prev = data[i - 1];
    if (prev && r.pos - prev.pos > 1) {
      rows.push(
        <tr key={`gap-${r.pos}`} className="gap-row" aria-hidden="true">
          <td colSpan={5} />
        </tr>
      );
    }
    const mine = highlighted.has(r.team_id);
    rows.push(
      <tr
        key={r.team_id}
        className={mine ? "row-mine" : ""}
        style={mine ? { "--team-accent": accentOf(r.team_id) ?? undefined } : undefined}
      >
        <td>{r.pos}</td>
        <td>{r.team}</td>
        <td>{r.played}</td>
        <td>{signed(r.gd)}</td>
        <td className="table__points">{r.points}</td>
      </tr>
    );
  });

  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Team</th>
          <th scope="col">P</th>
          <th scope="col">GD</th>
          <th scope="col">Pts</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}
