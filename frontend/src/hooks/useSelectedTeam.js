import { useCallback, useState } from "react";
import { storage } from "../lib/storage.js";

const KEY = "selectedTeam";

// Which view is open: "all" (the overview) or a followed team's id.
// Remembered in the browser. The first visit opens on the first followed team.
export function useSelectedTeam(teams) {
  const [saved, setSaved] = useState(() => storage.get(KEY));
  const ids = teams.map((t) => t.id);

  let selection;
  if (teams.length === 0) selection = "all";
  else if (teams.length === 1) selection = ids[0]; // nothing to pick between
  else if (saved === "all") selection = "all";
  else if (ids.includes(Number(saved))) selection = Number(saved);
  else selection = ids[0]; // first visit, or that team is no longer followed

  const setSelection = useCallback((value) => {
    storage.set(KEY, String(value));
    setSaved(String(value));
  }, []);

  return { selection, setSelection };
}
