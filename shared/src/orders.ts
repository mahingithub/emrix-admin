// Order model shared by the storefront, admin panel and server store.
import type { Size } from "./types";

export type PaymentMethod = "cod" | "bkash" | "nagad";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
export type OrderStatus = "placed" | "confirmed" | "printing" | "shipped" | "delivered" | "cancelled" | "returned";
export type Zone = "inside" | "outside";

export interface OrderLine {
  productId: string;
  slug: string;
  name: string;
  anime: string;
  colorName: string;
  size: Size;
  qty: number;
  price: number;
}

export interface OrderEvent {
  id: string;
  at: string;
  type: "created" | "status" | "payment" | "shipping" | "note";
  status?: OrderStatus;
  message: string;
  /** Admin display name; empty for customer/system events. */
  actor?: string;
  /** Internal notes are hidden from the customer's tracking page. */
  internal?: boolean;
}

export interface Order {
  code: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer: { name: string; phone: string; email?: string };
  shipping: { district: string; area: string; address: string; note?: string; zone: Zone };
  payment: { method: PaymentMethod; sender?: string; trxId?: string };
  courier?: { name: string; trackingNo: string };
  lines: OrderLine[];
  subtotal: number;
  delivery: number;
  discount: number;
  coupon?: string;
  total: number;
  events: OrderEvent[];
  /** Where the order came from. */
  source: "web";
}

export interface DeliverySettings {
  insideDhaka: number;
  outsideDhaka: number;
  freeOver: number;
  insideDays: string;
  outsideDays: string;
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "To verify",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "New",
  confirmed: "Confirmed",
  printing: "Printing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

/** Customer-facing progress steps. Cancelled/returned are shown separately. */
export const ORDER_STEPS: { key: OrderStatus; label: string; jp: string; hint: string }[] = [
  { key: "placed", label: "Order placed", jp: "注文受付", hint: "We've received your order." },
  { key: "confirmed", label: "Confirmed", jp: "確認済み", hint: "Our team called and confirmed it." },
  { key: "printing", label: "Printing", jp: "印刷中", hint: "Your tee is being printed & packed." },
  { key: "shipped", label: "Shipped", jp: "発送済み", hint: "Handed to the courier." },
  { key: "delivered", label: "Delivered", jp: "配達完了", hint: "Enjoy the drip. ありがとう!" },
];

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "confirmed",
  confirmed: "printing",
  printing: "shipped",
  shipped: "delivered",
};

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["printing", "cancelled"],
  printing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return ALLOWED[from].includes(to);
}

export const COURIERS = ["Steadfast", "Pathao", "RedX", "Paperfly", "Sundarban Courier", "eCourier", "Own rider"];

export function zoneFor(district: string): Zone {
  return district === "Dhaka" ? "inside" : "outside";
}

/** Free delivery applies at or above this subtotal; 0 means never. */
export const freeDeliveryOn = (subtotal: number, d: DeliverySettings) => d.freeOver > 0 && subtotal >= d.freeOver;

export function deliveryFee(district: string, subtotal: number, d: DeliverySettings) {
  if (freeDeliveryOn(subtotal, d)) return 0;
  if (!district) return null;
  return zoneFor(district) === "inside" ? d.insideDhaka : d.outsideDhaka;
}

export interface CouponInfo {
  code: string;
  type: "percent" | "flat";
  value: number;
  label: string;
  minOrder?: number;
}

export function couponDiscount(coupon: CouponInfo | null | undefined, subtotal: number) {
  if (!coupon) return 0;
  const raw = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.min(raw, subtotal);
}

/** Order as shown to the customer: internal notes removed. */
export function toPublicOrder(order: Order): Order {
  return { ...order, events: order.events.filter((e) => !e.internal) };
}
