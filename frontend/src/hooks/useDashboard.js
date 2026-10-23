import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client.js";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
  });
}
