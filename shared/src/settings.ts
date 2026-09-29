// Store settings edited in Admin → Settings. Shared by the storefront, admin and server.
import type { DeliverySettings } from "./orders";

export interface SocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
  messenger: string;
}

/** A numbered limited-edition product featured on the homepage with a countdown. */
export interface FeaturedDrop {
  productSlug: string;
  /** ISO time the drop closes. */
  endsAt: string;
  /** Edition size; pieces sold count against it. */
  total: number;
}

export interface StoreSettings {
  phone: string;
  email: string;
  address: string;
  hours: string;
  /** bKash / Nagad numbers customers send money to. Empty turns that payment option off. */
  wallets: { bkash: string; nagad: string };
  social: SocialLinks;
  delivery: DeliverySettings;
  /** Extra lines for the scrolling bar at the top of the shop. */
  announcements: string[];
  drop: FeaturedDrop | null;
}

/** Used until an owner saves Settings for the first time. Contact details start empty on purpose. */
export const DEFAULT_SETTINGS: StoreSettings = {
  phone: "",
  email: "",
  address: "",
  hours: "",
  wallets: { bkash: "", nagad: "" },
  social: { facebook: "", instagram: "", tiktok: "", messenger: "" },
  delivery: { insideDhaka: 70, outsideDhaka: 130, freeOver: 2000, insideDays: "1–2 days", outsideDays: "2–4 days" },
  announcements: ["Cash on Delivery all over Bangladesh", "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি", "7-day easy size exchange"],
  drop: null,
};

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** Wallets customers can pay with right now (a number is set). */
export function walletsOn(s: Pick<StoreSettings, "wallets">) {
  return { bkash: !!s.wallets.bkash.trim(), nagad: !!s.wallets.nagad.trim() };
}

/** The featured drop, if it's set up, still running and its product is on sale. */
export function liveDrop<P extends { slug: string }>(s: Pick<StoreSettings, "drop">, products: P[], now = Date.now()) {
  const drop = s.drop;
  if (!drop || Date.parse(drop.endsAt) <= now) return null;
  const product = products.find((p) => p.slug === drop.productSlug);
  return product ? { ...drop, product } : null;
}
