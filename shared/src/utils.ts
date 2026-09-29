export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Bangladeshi Taka, grouped the way it's written locally (1,00,000). */
export function formatBDT(amount: number) {
  return `৳${Math.round(amount).toLocaleString("en-IN")}`;
}

export function discountPercent(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

function parseHex(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function isDark(hex: string) {
  const { r, g, b } = parseHex(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
}

/** Blend `hex` toward `target` by `amount` (0–1). */
export function mix(hex: string, target: string, amount: number) {
  const a = parseHex(hex);
  const b = parseHex(target);
  const ch = (x: number, y: number) =>
    Math.round(x + (y - x) * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(a.r, b.r)}${ch(a.g, b.g)}${ch(a.b, b.b)}`;
}

/** Normalises BD mobile numbers to 01XXXXXXXXX, or returns null if invalid. */
export function normalizeBdPhone(input: string) {
  const digits = input.replace(/[^\d]/g, "").replace(/^880/, "0").replace(/^88/, "");
  return /^01[3-9]\d{8}$/.test(digits) ? digits : null;
}

/** A collection's colour washed into the current surface: a pastel on paper, a deep tint at night. */
export function tintBg(color: string) {
  return `color-mix(in srgb, ${color} 24%, var(--color-paper-2))`;
}
