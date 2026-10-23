import { useState } from "react";
import { useWidgetData } from "../../hooks/useWidgetData.js";
import CardShell from "./CardShell.jsx";
import { ErrorState, Skeleton } from "./states.jsx";
import Segmented from "../common/Segmented.jsx";
import LeaderBars from "../widgets/LeaderBars.jsx";

// One card for scorers and assists, with a toggle. The assists list is only fetched
// when you switch to it.
export default function LeadersCard({ competition, scorers, assists, teamName, askPrompt }) {
  const tabs = [
    scorers && { value: "goals", label: "Goals" },
    assists && { value: "assists", label: "Assists" },
  ].filter(Boolean);
  const [tab, setTab] = useState(tabs[0].value);

  const widget = (tab === "assists" ? assists : scorers) ?? scorers ?? assists;
  const { data, isLoading, isError, error, refetch, isFetching } = useWidgetData(widget);

  return (
    <CardShell title="Leaders" meta={competition} askPrompt={askPrompt}>
      {tabs.length > 1 && <Segmented label="Leaders by" options={tabs} value={tab} onChange={setTab} />}
      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <ErrorState detail={error?.message} onRetry={refetch} retrying={isFetching} />
      ) : (
        <>
          <LeaderBars key={tab} data={data} stat={tab} teamName={teamName} />
          {tab === "assists" && <p className="muted small">Among the league's top scorers only.</p>}
        </>
      )}
    </CardShell>
  );
}
