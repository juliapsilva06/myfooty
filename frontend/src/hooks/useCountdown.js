import { useEffect, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

// Counts down to an ISO timestamp. Seconds only tick in the last hour (and never for people
// who asked their device for reduced motion), so a far-off match re-renders twice a minute.
export function useCountdown(iso) {
  const target = new Date(iso).getTime();
  const invalid = Number.isNaN(target);
  const [now, setNow] = useState(() => Date.now());

  const remaining = invalid ? 0 : Math.max(0, Math.floor((target - now) / 1000));
  const showSeconds = !invalid && remaining < 3600 && !prefersReducedMotion();
  const tickMs = showSeconds ? 1000 : 30000;

  useEffect(() => {
    if (invalid) return undefined;
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [invalid, tickMs]);

  if (invalid) return { valid: false };
  return {
    valid: true,
    done: remaining === 0,
    days: Math.floor(remaining / 86400),
    hours: Math.floor((remaining % 86400) / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    seconds: remaining % 60,
    showSeconds,
  };
}
