import WidgetCard from "./WidgetCard.jsx";

export default function Dashboard({ widgets }) {
  if (!widgets?.length) {
    return <p className="muted">Nothing to show yet.</p>;
  }
  return (
    <div className="dashboard-grid">
      {widgets.map((w) => (
        <WidgetCard key={w.id} widget={w} />
      ))}
    </div>
  );
}
