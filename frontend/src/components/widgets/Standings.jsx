import { useState } from "react";
import { usePreferences } from "../../context/PreferencesContext.jsx";
import { pickRows } from "../../lib/standingsView.js";
import Segmented from "../common/Segmented.jsx";

const signed = (n) => (n > 0 ? `+${n}` : String(n));

// Receives the FULL table; the toggle chooses how much of it to show, so switching is instant.
export default function Standings({ widget, data }) {
  const { accentOf } = usePreferences();
  const all = data ?? [];
  const mine = new Set(widget.highlight_team_ids ?? []);
  const hasMine = all.some((r) => mine.has(r.team_id));
  const [view, setView] = useState(hasMine ? "around" : "top");

  if (!all.length) {
    return <p className="muted">No table available yet.</p>;
  }

  // "Around me" only makes sense when the team is actually in this table.
  const options = [
    { value: "top", label: "Top 5" },
    ...(hasMine ? [{ value: "around", label: "Around me" }] : []),
    { value: "full", label: "Full table" },
  ];
  const activeView = options.some((o) => o.value === view) ? view : "top";
  const visible = pickRows(all, activeView, mine);

  // A dotted rule marks each jump in positions (top 5, then your team further down).
  const rows = [];
  visible.forEach((r, i) => {
    const prev = visible[i - 1];
    if (prev && r.pos - prev.pos > 1) {
      rows.push(
        <tr key={`gap-${r.pos}`} className="gap-row" aria-hidden="true">
          <td colSpan={5} />
        </tr>
      );
    }
    const isMine = mine.has(r.team_id);
    rows.push(
      <tr
        key={r.team_id}
        className={isMine ? "row-mine" : ""}
        style={isMine ? { "--team-accent": accentOf(r.team_id) ?? undefined } : undefined}
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
    <>
      <Segmented label="Table view" options={options} value={activeView} onChange={setView} />
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
    </>
  );
}
