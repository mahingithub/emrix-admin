// The admin panel's link to the backend API (server only). Every call carries the shared key and
// the signed-in admin's session token (from the httpOnly cookie). Set API_URL and
// INTERNAL_API_KEY in admin/.env.local or the host's environment settings.
import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  HEADERS,
  type ActivityList,
  type ApiErrorBody,
  type CustomerHistory,
  type CustomerList,
  type CustomerSort,
  type DashboardData,
  type LaunchStatus,
  type OrderFilter,
  type OrderList,
  type RangeKey,
  type Risk,
  type SetupStatus,
  type StarterGap,
} from "@emrix/shared/api";
import type { Order, OrderStatus } from "@emrix/shared/orders";
import type { AdminSummary, CouponRecord, StockMovement } from "@emrix/shared/records";
import type { StoreSettings } from "@emrix/shared/settings";
import type { Anime, Product } from "@emrix/shared/types";

export const SESSION_COOKIE = "emrix_admin";

export class BackendError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

const apiUrl = () => (process.env.API_URL ?? "").trim().replace(/\/+$/, "");

/** Calls the backend; failures throw BackendError carrying the backend's message. */
export async function backend<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = apiUrl();
  if (!base) throw new BackendError(503, "API_URL is not set. Add the backend's address to the admin panel's environment (see admin/.env.example).");
  const h = new Headers(init.headers);
  const key = process.env.INTERNAL_API_KEY?.trim();
  if (key) h.set(HEADERS.key, key);
  const incoming = await headers();
  h.set(HEADERS.clientIp, incoming.get("x-forwarded-for")?.split(",")[0].trim() || incoming.get("x-real-ip") || "local");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) h.set("authorization", `Bearer ${token}`);
  if (typeof init.body === "string" && !h.has("content-type")) h.set("content-type", "application/json");
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { ...init, headers: h, cache: "no-store" });
  } catch (e) {
    throw new BackendError(503, `Couldn't reach the backend (${e instanceof Error ? e.message : e}). Is it running?`);
  }
  const data = (await res.json().catch(() => null)) as (T & Partial<ApiErrorBody>) | null;
  if (!res.ok) throw new BackendError(res.status, data?.error ?? `The backend answered ${res.status}.`, data?.code);
  return data as T;
}

/** JSON request that changes something (used by server actions). */
export const send = <T = { ok: true }>(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown) =>
  backend<T>(path, { method, ...(body !== undefined && { body: JSON.stringify(body) }) });

/** For pages: a read that sends signed-out admins to the login page. */
async function read<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await backend<T>(path, init);
  } catch (e) {
    if (e instanceof BackendError && e.status === 401) redirect("/login");
    throw e;
  }
}

/** Like `read`, but null when the thing doesn't exist. */
async function find<T>(path: string): Promise<T | null> {
  try {
    return await read<T>(path);
  } catch (e) {
    if (e instanceof BackendError && e.status === 404) return null;
    throw e;
  }
}

const query = (params: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
};

/* --- Setup (no session needed) ------------------------------------------------------------- */

export const getSetupStatus = () => backend<SetupStatus>("/admin/setup");

/* --- Catalogue ------------------------------------------------------------------------------ */

export const getAllAnimes = cache(() => read<Anime[]>("/admin/animes"));
export const getAllProducts = cache(() => read<Product[]>("/admin/products"));
export const findProductsByIds = async (ids: string[]) =>
  ids.length ? read<Product[]>(`/admin/products${query({ ids: [...new Set(ids)].join(",") })}`) : ([] as Product[]);
/** A product plus whether any order uses it (it can't be deleted then), or null. */
export const findProduct = cache((id: string) => find<{ product: Product; hasOrders: boolean }>(`/admin/products/${encodeURIComponent(id)}`));
export const findAnime = cache((slug: string) => find<Anime>(`/admin/animes/${encodeURIComponent(slug)}`));
export const productCounts = cache(() => read<Record<string, number>>("/admin/product-counts"));
export const starterCatalogGap = () => read<StarterGap>("/admin/starter-gap");
export const recentStockMovements = (limit = 25) => read<StockMovement[]>(`/admin/stock/movements${query({ limit })}`);

/* --- Orders and customers ------------------------------------------------------------------- */

export const listOrders = (filter: OrderFilter) =>
  read<OrderList>(`/admin/orders${query({ ...filter, status: filter.status === "all" ? undefined : filter.status })}`);
export const countOrders = async (status: OrderStatus) => (await read<{ count: number }>(`/admin/orders/count${query({ status })}`)).count;
export const getOrder = cache((code: string) => find<Order>(`/admin/orders/${encodeURIComponent(code)}`));
// Phone numbers travel in request bodies rather than URLs, so they stay out of logs.
export const getCustomerHistory = (phone: string) => read<CustomerHistory>("/admin/customers/history", { method: "POST", body: JSON.stringify({ phone }) });
export const riskByPhone = async (phones: string[]) =>
  new Map(phones.length ? Object.entries(await read<Record<string, Risk>>("/admin/customers/risk", { method: "POST", body: JSON.stringify({ phones }) })) : []);
export const listCustomers = (p: { q?: string; sort?: CustomerSort; page?: number; pageSize?: number }) => read<CustomerList>(`/admin/customers${query(p)}`);

/* --- Store ---------------------------------------------------------------------------------- */

export const getSettings = cache(() => read<StoreSettings>("/admin/settings"));
export const getDashboard = (range: RangeKey) => read<DashboardData>(`/admin/dashboard${query({ range })}`);
export const getLaunchStatus = () => read<LaunchStatus>("/admin/launch-status");
export const listCoupons = () => read<CouponRecord[]>("/admin/coupons");
export const listAdmins = () => read<AdminSummary[]>("/admin/staff");
export const listActivity = (p: { page?: number; pageSize?: number; actor?: string }) => read<ActivityList>(`/admin/activity${query(p)}`);
