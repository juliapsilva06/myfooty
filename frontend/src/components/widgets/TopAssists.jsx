import PlayerList from "./PlayerList.jsx";

export default function TopAssists({ data }) {
  return (
    <PlayerList
      data={data}
      stat="assists"
      note="Among the league's top scorers only."
    />
  );
}
