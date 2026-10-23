import { useEffect } from "react";
import { REGISTRY } from "../widgets/registry.js";
import { useWidgetData } from "../../hooks/useWidgetData.js";
import CardShell from "./CardShell.jsx";
import { ErrorState, Skeleton } from "./states.jsx";

export default function WidgetCard({ widget, title, meta, askPrompt }) {
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
    <CardShell title={title ?? widget.title} meta={meta} askPrompt={askPrompt}>
      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <ErrorState detail={error?.message} onRetry={refetch} retrying={isFetching} />
      ) : (
        <Component widget={widget} data={data} />
      )}
    </CardShell>
  );
}
