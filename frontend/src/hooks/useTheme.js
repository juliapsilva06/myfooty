import { useCallback, useEffect, useState } from "react";
import { storage } from "../lib/storage.js";

const KEY = "theme";
const VALID = ["dark", "light", "system"];

function resolve(theme) {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Theme choice: "dark" (default), "light", or "system". The tiny script in index.html
// applies the saved choice before React loads; this hook keeps it in sync afterwards.
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const saved = storage.get(KEY);
    return VALID.includes(saved) ? saved : "dark";
  });

  useEffect(() => {
    const apply = () => document.documentElement.setAttribute("data-theme", resolve(theme));
    apply();
    if (theme !== "system") return undefined;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (!VALID.includes(next)) return;
    storage.set(KEY, next);
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
