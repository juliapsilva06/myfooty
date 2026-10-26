const pad = (n) => String(n).padStart(2, "0");

// Takes the object returned by useCountdown(): "2d 21h 14m", "5h 02m", "14m 05s".
export function formatCountdown(c) {
  if (c.days > 0) return `${c.days}d ${c.hours}h ${pad(c.minutes)}m`;
  if (c.hours > 0) return `${c.hours}h ${pad(c.minutes)}m`;
  if (c.showSeconds) return `${c.minutes}m ${pad(c.seconds)}s`;
  return c.minutes > 0 ? `${c.minutes}m` : "Under a minute";
}
