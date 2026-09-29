// What the backend's HTTP API sends and expects, shared so the frontend and admin panel stay in
// step with it. Request bodies are validated with the schemas in ./schemas.
import type { ActivityRecord } from "./records";
import type { CouponInfo, Order, OrderStatus, PaymentMethod, PaymentStatus, Zone } from "./orders";
import type { StoreSettings } from "./settings";
import type { Anime, Product, Size } from "./types";

/* --- Server-to-server headers ------------------------------------------------------------------ */

/**
 * The frontend and admin panel call the backend from their servers. They prove it with the shared
 * INTERNAL_API_KEY, and pass along who the visitor is, which the backend needs for its rate limits.
 */
export const HEADERS = {
  key: "x-emrix-key",
  clientIp: "x-emrix-client-ip",
  shopper: "x-emrix-shopper",
} as const;

/**
 * Error body for any failed request. `code` is set where the apps react to the reason
 * (e.g. "signed_out", "setup_required", "database_not_configured").
 */
export interface ApiErrorBody {
  error: string;
  code?: string;
}

/* --- Storefront ------------------------------------------------------------------------------ */

/** Everything the shop shows: live collections and products, store settings, and whether try-on is on. */
export interface StorefrontData {
  animes: Anime[];
  products: Product[];
  settings: StoreSettings;
  tryOn: boolean;
}

export type CheckoutResult = { ok: true; code: string } | { ok: false; errors?: Record<string, string>; message?: string };

export type CouponCheck = { ok: true; coupon: CouponInfo } | { ok: false; error: string };

export type TryOnJobStatus = { state: "working" } | { state: "done"; output: string } | { state: "failed"; error: string };

/* --- Admin: sign-in ---------------------------------------------------------------------------- */

export const MIN_SETUP_KEY = 12;

export type SetupKeyStatus = "missing" | "weak" | "ok";

export interface SetupStatus {
  /** False on a fresh database: the first owner still has to be created. */
  hasAdmin: boolean;
  setupKey: SetupKeyStatus;
}

/** A signed-in admin session. The admin panel keeps the token in an httpOnly cookie. */
export interface AdminSession {
  token: string;
  expiresAt: string;
}

/* --- Admin: orders and customers ----------------------------------------------------------------- */

export const STATUS_TABS: (OrderStatus | "all")[] = ["all", "placed", "confirmed", "printing", "shipped", "delivered", "cancelled", "returned"];

export interface OrderFilter {
  status?: OrderStatus | "all";
  q?: string;
  payment?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  zone?: Zone;
  page?: number;
  pageSize?: number;
}

export interface OrderList {
  rows: Order[];
  total: number;
  page: number;
  pages: number;
  counts: Record<OrderStatus | "all", number>;
}

export type Risk = "new" | "trusted" | "watch" | "high";

export function riskOf({ delivered, cancelled, returned }: { delivered: number; cancelled: number; returned: number }): Risk {
  const failed = cancelled + returned;
  return failed >= 2 && failed >= delivered ? "high" : failed >= 1 && failed >= delivered ? "watch" : delivered >= 1 ? "trusted" : "new";
}

export interface CustomerHistory {
  orders: number;
  delivered: number;
  cancelled: number;
  returned: number;
  spent: number;
  firstOrderAt: string;
  risk: Risk;
  recent: Pick<Order, "code" | "createdAt" | "status" | "total">[];
}

export interface CustomerRow {
  phone: string;
  name: string;
  email?: string;
  district: string;
  orders: number;
  delivered: number;
  cancelled: number;
  returned: number;
  spent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  risk: Risk;
}

export const CUSTOMER_SORTS = ["recent", "orders", "spent"] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];

export interface CustomerList {
  rows: CustomerRow[];
  total: number;
  repeat: number;
  spent: number;
  page: number;
  pages: number;
}

export interface ActivityList {
  rows: ActivityRecord[];
  total: number;
  page: number;
  pages: number;
  actors: string[];
}

/* --- Admin: dashboard ---------------------------------------------------------------------------- */

export const RANGES = { "7d": 7, "30d": 30, "90d": 90 } as const;
export type RangeKey = keyof typeof RANGES;

interface Kpi {
  value: number;
  delta: number | null;
}

export interface PeriodSummary {
  sales: number;
  orders: number;
  cancelled: number;
  aov: number;
  items: number;
  success: number | null;
}

/**
 * Dashboard figures. For roles that can't see revenue, every money figure is 0 and `zones` counts
 * orders instead of sales.
 */
export interface DashboardData {
  range: RangeKey;
  days: number;
  kpis: {
    sales: Kpi;
    orders: Kpi & { cancelled: number };
    aov: Kpi;
    success: { value: number | null; delta: number | null };
    items: number;
  };
  daily: { date: string; sales: number; orders: number }[];
  attention: { toConfirm: number; toVerify: number; toPrint: number; toShip: number; inTransit: number };
  pipeline: { status: OrderStatus; count: number }[];
  topProducts: { id: string; name: string; anime: string; animeName: string; units: number; revenue: number }[];
  topAnime: { slug: string; name: string; kanji: string; units: number; revenue: number }[];
  districts: { name: string; orders: number; sales: number }[];
  zones: { inside: number; outside: number };
  payments: Record<PaymentMethod, { orders: number; sales: number }>;
  recent: Order[];
  today: PeriodSummary;
  lowStock: {
    count: number;
    out: number;
    top: { productId: string; name: string; color: string; size: Size; left: number; lowAt: number }[];
  };
}

/** Which launch steps an owner has done (the admin panel words and links them). */
export interface LaunchStatus {
  phone: boolean;
  wallet: boolean;
  product: boolean;
  social: boolean;
  team: boolean;
}

/** How much of the launch catalogue isn't in the database yet. */
export interface StarterGap {
  animes: number;
  products: number;
}
