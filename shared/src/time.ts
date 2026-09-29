// Bangladesh is UTC+6 all year (no DST), so day maths uses a fixed offset.
export const TZ = "Asia/Dhaka";
const OFFSET_MS = 6 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" of the given instant in Dhaka. */
export function dhakaDayKey(date: Date | string | number) {
  return new Date(new Date(date).getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** UTC instant of Dhaka midnight for the day containing `date`. */
export function startOfDhakaDay(date: Date | string | number) {
  return new Date(Date.parse(`${dhakaDayKey(date)}T00:00:00Z`) - OFFSET_MS);
}

export function formatDhaka(date: Date | string | number, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...options }).format(new Date(date));
}

export const fmtDateTime = (d: Date | string | number) =>
  formatDhaka(d, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });

export const fmtDate = (d: Date | string | number) =>
  formatDhaka(d, { day: "numeric", month: "short", year: "numeric" });

export function timeAgo(date: Date | string | number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(date).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(date);
}

/** ISO time → "YYYY-MM-DDTHH:mm" in Dhaka, for <input type="datetime-local">. */
export function toDhakaInput(iso: string | undefined) {
  if (!iso || Number.isNaN(Date.parse(iso))) return "";
  return new Date(Date.parse(iso) + 6 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

/** "YYYY-MM-DDTHH:mm" typed in Dhaka time (UTC+6, no daylight saving) → ISO, or null. */
export function fromDhakaInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const t = Date.parse(`${value}:00+06:00`);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}
