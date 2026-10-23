import { useEffect } from "react";
import { REGISTRY } from "../widgets/registry.js";
import { useWidgetData } from "../../hooks/useWidgetData.js";

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton-line" style={{ width: "70%" }} />
      <div className="skeleton-line" style={{ width: "90%" }} />
      <div className="skeleton-line" style={{ width: "55%" }} />
    </div>
  );
}

function ErrorState({ message, onRetry, retrying }) {
  return (
    <div className="error-state" role="alert">
      <p className="muted">{message || "Couldn't load this widget."}</p>
      <button className="btn" onClick={onRetry} disabled={retrying}>
        {retrying ? "Retrying..." : "Try again"}
      </button>
    </div>
  );
}

export default function WidgetCard({ widget }) {
  const Component = REGISTRY[widget.type];
  const { data, isLoading, isError, error, refetch, isFetching } = useWidgetData(widget, {
    enabled: Boolean(Component),
  });

  useEffect(() => {
    if (!Component) console.warn(`Unknown widget type "${widget.type}" was skipped.`);
  }, [Component, widget.type]);

  // Unknown widget types are skipped instead of crashing the page.
  if (!Component) return null;

  return (
    <section className="card">
      <h2 className="card__title">{widget.title}</h2>
      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={refetch} retrying={isFetching} />
      ) : (
        <Component widget={widget} data={data} />
      )}
    </section>
  );
}
