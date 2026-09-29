// Records the backend stores and hands to the admin panel as-is.
import type { AdminRole } from "./admin";
import type { Size } from "./types";

/** A team member's account, without the password hash. */
export interface AdminSummary {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CouponRecord {
  code: string;
  type: "percent" | "flat";
  value: number;
  label: string;
  minOrder?: number;
  maxUses?: number;
  used: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

export interface ActivityRecord {
  id: string;
  at: string;
  actor: string;
  action: string;
  target?: string;
}

export type StockReason = "order" | "cancelled" | "returned" | "restock" | "damaged" | "correction";

export interface StockMovement {
  id: string;
  at: string;
  productId: string;
  product: string;
  color: string;
  size: Size;
  delta: number;
  after: number;
  reason: StockReason;
  ref?: string;
  actor?: string;
}
