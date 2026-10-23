import { createContext, useContext, useMemo } from "react";
import { defaultAccent, storedAccent } from "../lib/accents.js";

// Lets any widget know which teams the user follows and what color each one has.
const PreferencesContext = createContext({
  teams: [],
  accentOf: () => null,
  followedTeam: () => undefined,
});

export function PreferencesProvider({ preferences, children }) {
  const value = useMemo(() => {
    const teams = preferences?.teams ?? [];
    return {
      teams,
      // Returns a "#rrggbb" color for a followed team, or null for anyone else.
      accentOf: (teamId) => {
        const index = teams.findIndex((t) => t.id === teamId);
        return index === -1 ? null : storedAccent(teamId) ?? defaultAccent(index);
      },
      // Finds a followed team by id, or by name when the backend didn't send an id.
      followedTeam: ({ id, name }) => teams.find((t) => (id != null ? t.id === id : t.name === name)),
    };
  }, [preferences]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
