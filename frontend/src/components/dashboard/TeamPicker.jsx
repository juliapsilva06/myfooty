import { useRef } from "react";
import { usePreferences } from "../../context/PreferencesContext.jsx";
import { teamCode } from "../../lib/teamCode.js";
import Monogram from "../common/Monogram.jsx";

// Tabs: "All teams", then one per followed team. Arrow keys, Home, and End move between them.
export default function TeamPicker({ teams, selection, onSelect }) {
  const { accentOf } = usePreferences();
  const refs = useRef([]);
  const items = [{ id: "all", label: "All teams" }, ...teams.map((t) => ({ id: t.id, label: t.name, team: t }))];
  const current = items.findIndex((i) => i.id === selection);

  function handleKeyDown(e) {
    let next = null;
    if (e.key === "ArrowRight") next = (current + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next === null) return;
    e.preventDefault();
    onSelect(items[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div className="team-picker" role="tablist" aria-label="Teams" onKeyDown={handleKeyDown}>
      {items.map((item, i) => {
        const selected = item.id === selection;
        const accent = item.team ? accentOf(item.team.id) : null;
        return (
          <button
            key={item.id}
            ref={(el) => (refs.current[i] = el)}
            id={`tab-${item.id}`}
            role="tab"
            type="button"
            className="team-tab"
            aria-selected={selected}
            aria-controls="view-panel"
            tabIndex={selected ? 0 : -1}
            style={accent ? { "--tab-accent": accent } : undefined}
            onClick={() => onSelect(item.id)}
          >
            {item.team && <Monogram code={teamCode(item.team)} size="sm" accent={accent} />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
