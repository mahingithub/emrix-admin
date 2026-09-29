"use client";

import { useState } from "react";
import { PAYMENT_LABEL, type PaymentMethod } from "@emrix/shared/orders";
import { cn, formatBDT } from "@emrix/shared/utils";

// Validated categorical set (dataviz validator, light surface #fff): all checks pass.
// Nagad orange is under 3:1 contrast, so every segment also has a visible text label.
const COLORS: Record<PaymentMethod, string> = { cod: "#2a78d6", bkash: "#e2136e", nagad: "#f6921e" };

export function PaymentMix({
  data,
  showMoney,
}: {
  data: Record<PaymentMethod, { orders: number; sales: number }>;
  showMoney: boolean;
}) {
  const [hover, setHover] = useState<PaymentMethod | null>(null);
  const keys = (Object.keys(COLORS) as PaymentMethod[]).filter((k) => data[k].orders > 0);
  const total = keys.reduce((n, k) => n + data[k].orders, 0);
  if (!total) return <p className="text-sm text-ink/55">No orders in this period.</p>;

  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label="Orders by payment method">
        {keys.map((k) => (
          <span
            key={k}
            onPointerEnter={() => setHover(k)}
            onPointerLeave={() => setHover(null)}
            className="h-full transition-opacity"
            style={{ width: `${(data[k].orders / total) * 100}%`, backgroundColor: COLORS[k], opacity: hover && hover !== k ? 0.35 : 1 }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {keys.map((k) => (
          <li
            key={k}
            onPointerEnter={() => setHover(k)}
            onPointerLeave={() => setHover(null)}
            className={cn("flex items-center gap-2.5 text-sm transition-opacity", hover && hover !== k && "opacity-50")}
          >
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: COLORS[k] }} />
            <span className="flex-1 text-ink/75">{PAYMENT_LABEL[k]}</span>
            <span className="font-semibold tabular-nums">{Math.round((data[k].orders / total) * 100)}%</span>
            <span className="w-24 text-right text-xs tabular-nums text-ink/50">
              {showMoney ? formatBDT(data[k].sales) : `${data[k].orders} orders`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
