import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client.js";

// Each widget loads its own data, so one slow or failing widget never blocks the rest.
export function useWidgetData(widget, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["widget", widget.id],
    queryFn: async () => {
      const res = await api.getWidgetData(widget);
      // The backend reports widget failures as { id, error } with HTTP 200
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // the backend caches too, so don't refetch eagerly
  });
}
