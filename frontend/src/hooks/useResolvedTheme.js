import { useEffect, useState } from "react";

const read = () => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

// The theme actually on screen right now: "dark" or "light".
// (Even if the menu says "Match my device", this reports what that turned into.)
export function useResolvedTheme() {
  const [theme, setTheme] = useState(read);

  useEffect(() => {
    // The theme menu changes data-theme on <html>; watch for it.
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    setTheme(read());
    return () => observer.disconnect();
  }, []);

  return theme;
}
