import { useMemo } from "react";
import { usePreferences } from "../../context/PreferencesContext.jsx";
import { useSelectedTeam } from "../../hooks/useSelectedTeam.js";
import { groupWidgets } from "../../lib/groupWidgets.js";
import Overview from "./Overview.jsx";
import TeamPicker from "./TeamPicker.jsx";
import TeamView from "./TeamView.jsx";

export default function Dashboard({ widgets }) {
  const { teams } = usePreferences();
  const groups = useMemo(() => groupWidgets(widgets), [widgets]);
  const { selection, setSelection } = useSelectedTeam(teams);

  if (!widgets?.length) {
    return <p className="muted">Nothing to show yet. Open Menu, then Edit dashboard, to choose teams and stats.</p>;
  }

  const showPicker = teams.length > 1;
  const team = teams.find((t) => t.id === selection) ?? null;

  return (
    <div className="dashboard">
      {showPicker && <TeamPicker teams={teams} selection={selection} onSelect={setSelection} />}
      <div
        id="view-panel"
        role={showPicker ? "tabpanel" : undefined}
        aria-labelledby={showPicker ? `tab-${selection}` : undefined}
      >
        {showPicker && selection === "all" ? (
          <Overview teams={teams} groups={groups} onOpen={setSelection} />
        ) : (
          <TeamView key={selection} team={team} groups={groups} />
        )}
      </div>
    </div>
  );
}
