import PlayerList from "./PlayerList.jsx";

export default function TopScorers({ data }) {
  return <PlayerList data={data} stat="goals" />;
}
