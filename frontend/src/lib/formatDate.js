const dateTime = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const timeOnly = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const longDate = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });

// The backend sends UTC timestamps; these show them in the viewer's local time.
export function formatMatchDate(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Date to be confirmed" : dateTime.format(date);
}

export function formatToday() {
  return longDate.format(new Date());
}

// "Today", "Tomorrow", "In 3 days" based on calendar days in local time.
export function relativeDay(iso, now = new Date()) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { days: null, label: "Date to be confirmed" };
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86400000);
  if (days < 0) return { days, label: "Result pending" };
  if (days === 0) return { days, label: "Today" };
  if (days === 1) return { days, label: "Tomorrow" };
  return { days, label: `In ${days} days` };
}

// Today and tomorrow only need the time; later dates need the whole date.
export function formatKickoff(iso, days) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return days === 0 || days === 1 ? timeOnly.format(date) : dateTime.format(date);
}
