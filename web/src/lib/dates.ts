const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Tehran",
});

const dayFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  dateStyle: "medium",
  timeZone: "Asia/Tehran",
});

const relative = new Intl.RelativeTimeFormat("fa", { numeric: "auto" });

export function formatDate(value: string | Date): string {
  return formatter.format(new Date(value));
}

/** The Jalali date without the time, for things where the hour does not matter (like the day someone joined). */
export function formatDay(value: string | Date): string {
  return dayFormatter.format(new Date(value));
}

/** "۳ ساعت پیش", "دیروز", or a plain Jalali date once it is older than a week. */
export function formatRelative(value: string | Date): string {
  const date = new Date(value);
  // Never "from now": the server's clock stamps the time, and a viewer's clock running behind would make it look future.
  const seconds = Math.min(0, Math.round((date.getTime() - Date.now()) / 1000));
  const abs = Math.abs(seconds);
  if (abs < 45) return relative.format(0, "second");
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86_400) return relative.format(Math.round(seconds / 86_400), "day");
  return dayFormatter.format(date);
}
