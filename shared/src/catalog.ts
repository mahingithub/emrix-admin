// Catalogue constants + pure helpers shared by the storefront, admin and server.
// Live products and anime collections come from the backend (see backend/src/catalog.ts).
import type { Anime, Fit, Motif, Product, Size } from "./types";

export const SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

export const TEE = {
  black: { name: "Black", hex: "#17171b" },
  white: { name: "White", hex: "#f5f3ee" },
  navy: { name: "Navy", hex: "#1b2340" },
  olive: { name: "Olive", hex: "#4f5635" },
  maroon: { name: "Maroon", hex: "#5a1c26" },
  sand: { name: "Sand", hex: "#d8caae" },
  orange: { name: "Orange", hex: "#e5672a" },
  charcoal: { name: "Charcoal", hex: "#36373d" },
} as const;

/** Swatches offered when adding colours to a product. */
export const COLOR_PRESETS = Object.values(TEE);

export const MOTIFS: { value: Motif; label: string }[] = [
  { value: "hinomaru", label: "Rising sun" },
  { value: "burst", label: "Aura burst" },
  { value: "slash", label: "Claw slash" },
  { value: "spiral", label: "Spiral" },
  { value: "box", label: "Box logo" },
  { value: "vertical", label: "Vertical kanji" },
  { value: "checker", label: "Checker" },
  { value: "wave", label: "Waves" },
];

/** Measurements in inches. */
export const SIZE_CHART: Record<Fit, { size: Size; chest: number; length: number; sleeve: number }[]> = {
  regular: [
    { size: "S", chest: 38, length: 27, sleeve: 7.5 },
    { size: "M", chest: 40, length: 28, sleeve: 8 },
    { size: "L", chest: 42, length: 29, sleeve: 8.25 },
    { size: "XL", chest: 44, length: 30, sleeve: 8.5 },
    { size: "XXL", chest: 46, length: 31, sleeve: 9 },
  ],
  oversized: [
    { size: "S", chest: 42, length: 27.5, sleeve: 9 },
    { size: "M", chest: 44, length: 28.5, sleeve: 9.5 },
    { size: "L", chest: 46, length: 29.5, sleeve: 10 },
    { size: "XL", chest: 48, length: 30.5, sleeve: 10.5 },
    { size: "XXL", chest: 50, length: 31.5, sleeve: 11 },
  ],
};

export const FIT_LABEL: Record<Fit, string> = {
  regular: "Regular Fit",
  oversized: "Oversized · Drop Shoulder",
};

export const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "Newest" },
  { value: "popular", label: "Best selling" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

/* --- Stock ---------------------------------------------------------- */

export function stockOf(p: Product, color: string, size: Size) {
  return p.stock[color]?.[size] ?? 0;
}

export function sizeAvailable(p: Product, size: Size, color?: string) {
  return color ? stockOf(p, color, size) > 0 : p.colors.some((c) => stockOf(p, c.name, size) > 0);
}

export function totalStock(p: Product) {
  return p.colors.reduce((n, c) => n + SIZES.reduce((m, s) => m + stockOf(p, c.name, s), 0), 0);
}

export type StockState = "in" | "low" | "out";

export function variantState(p: Product, color: string, size: Size): StockState {
  const n = stockOf(p, color, size);
  return n <= 0 ? "out" : n <= p.lowStockAt ? "low" : "in";
}

/* --- Queries (pure; callers pass the live lists) --------------------- */

export interface ProductQuery {
  anime?: string;
  fit?: string;
  size?: string;
  tag?: string;
  q?: string;
  sort?: string;
}

export function filterProducts(products: Product[], animes: Anime[], query: ProductQuery) {
  let list = products.slice();
  if (query.anime) list = list.filter((p) => p.anime === query.anime);
  if (query.fit === "regular" || query.fit === "oversized") list = list.filter((p) => p.fit === query.fit);
  if (query.size && SIZES.includes(query.size as Size)) list = list.filter((p) => sizeAvailable(p, query.size as Size));
  if (query.tag) list = list.filter((p) => p.badges.includes(query.tag as Product["badges"][number]));
  if (query.q) {
    const q = query.q.trim().toLowerCase();
    list = list.filter((p) => {
      const anime = animes.find((a) => a.slug === p.anime);
      return [p.name, p.jp, p.art.sub, p.art.kanji, anime?.name, anime?.jp].join(" ").toLowerCase().includes(q);
    });
  }
  const score = (p: Product) =>
    p.sold + (p.badges.includes("limited") ? 3000 : 0) + (p.badges.includes("new") ? 800 : 0) - (totalStock(p) === 0 ? 5000 : 0);
  switch (query.sort) {
    case "new":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "popular":
      return list.sort((a, b) => b.sold - a.sold);
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    default:
      return list.sort((a, b) => score(b) - score(a));
  }
}

export function relatedTo(products: Product[], product: Product, limit = 4) {
  const same = products.filter((p) => p.anime === product.anime && p.id !== product.id);
  const others = products
    .filter((p) => p.anime !== product.anime && p.fit === product.fit)
    .sort((a, b) => b.sold - a.sold);
  return [...same, ...others].slice(0, limit);
}

export const fitShort = (fit: Fit) => (fit === "oversized" ? "Oversized" : "Regular");
