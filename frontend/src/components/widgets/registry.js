import NextMatch from "./NextMatch.jsx";
import RecentResults from "./RecentResults.jsx";
import Standings from "./Standings.jsx";
import TopScorers from "./TopScorers.jsx";
import TopAssists from "./TopAssists.jsx";

// Maps a widget type from the backend to the component that draws it.
// To add a new widget: write the component, add it here, and add the type in backend build_widgets().
export const REGISTRY = {
  next_match: NextMatch,
  recent_results: RecentResults,
  standings: Standings,
  top_scorers: TopScorers,
  top_assists: TopAssists,
};
