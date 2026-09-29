"use client";

import { ListFilters, type FilterSelect } from "../list-filters";

const SELECTS: FilterSelect[] = [
  { key: "payment", label: "Method", aria: "Payment method", options: [["cod", "Cash on Delivery"], ["bkash", "bKash"], ["nagad", "Nagad"]] },
  {
    key: "paymentStatus",
    label: "Payment",
    aria: "Payment status",
    options: [["pending", "To verify"], ["paid", "Paid"], ["unpaid", "Unpaid"], ["failed", "Failed"], ["refunded", "Refunded"]],
  },
  { key: "zone", label: "Zone", aria: "Delivery zone", options: [["inside", "Inside Dhaka"], ["outside", "Outside Dhaka"]] },
];

export function OrderFilters() {
  return <ListFilters selects={SELECTS} placeholder="Order ID, phone, name, area…" keep={["status"]} />;
}
