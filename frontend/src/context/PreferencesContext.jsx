import { createContext, useContext, useMemo, useState } from "react";
import { useResolvedTheme } from "../hooks/useResolvedTheme.js";
import { clearAccent, saveAccent } from "../lib/accentStore.js";
import { defaultAccent, storedAccent } from "../lib/accents.js";
import { ensureContrast } from "../lib/color.js";

// The page colors from tokens.css, used to keep team colors readable on each theme.
const PAGE_BACKGROUND = { dark: "#0D1411", light: "#EDF0EA" };

// Lets any widget know which teams the user follows and what color each one has.
const PreferencesContext = createContext({
  teams: [],
  accentOf: () => null,
  baseAccentOf: () => null,
  hasCustomAccent: () => false,
  setAccent: () => false,
  resetAccent: () => {},
  followedTeam: () => undefined,
});

export function PreferencesProvider({ preferences, children }) {
  const theme = useResolvedTheme();
  // Colors picked this session. Also saved to the browser, but if saving is blocked
  // the new color still applies until the page is closed.
  const [session, setSession] = useState({});

  const value = useMemo(() => {
    const teams = preferences?.teams ?? [];

    // The color the visitor chose (or the default for this team's position), before any readability fix.
    const baseAccentOf = (teamId) => {
      const index = teams.findIndex((t) => t.id === teamId);
      if (index === -1) return null;
      return session[teamId] ?? storedAccent(teamId) ?? defaultAccent(index);
    };

    return {
      teams,
      baseAccentOf,
      // The color actually drawn: the chosen one, nudged lighter or darker only if it would vanish on this theme.
      accentOf: (teamId) => {
        const base = baseAccentOf(teamId);
        return base ? ensureContrast(base, PAGE_BACKGROUND[theme]).hex : null;
      },
      hasCustomAccent: (teamId) => session[teamId] != null || storedAccent(teamId) !== null,
      // Returns true when the choice was saved in the browser.
      setAccent: (teamId, hex) => {
        const saved = saveAccent(teamId, hex);
        setSession((prev) => ({ ...prev, [teamId]: hex.toUpperCase() }));
        return saved;
      },
      resetAccent: (teamId) => {
        clearAccent(teamId);
        setSession((prev) => {
          const next = { ...prev };
          delete next[teamId];
          return next;
        });
      },
      // Finds a followed team by id, or by name when the backend didn't send an id.
      followedTeam: ({ id, name }) => teams.find((t) => (id != null ? t.id === id : t.name === name)),
    };
  }, [preferences, theme, session]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
