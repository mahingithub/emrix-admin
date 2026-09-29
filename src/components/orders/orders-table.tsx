"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { CheckCircle2, Loader2, PackageOpen, Printer, ShieldAlert, Truck, X } from "lucide-react";
import { PAYMENT_LABEL, type OrderStatus, type PaymentMethod, type PaymentStatus } from "@emrix/shared/orders";
import { cn, formatBDT } from "@emrix/shared/utils";
import type { Product } from "@emrix/shared/types";
import { ProductVisual } from "@emrix/shared/ui/product-visual";
import { bulkStatusAction } from "@/actions/admin";
import { PaymentBadge, StatusBadge } from "../ui";

export interface OrderRow {
  code: string;
  placedAt: string;
  ago: string;
  customer: string;
  phone: string;
  district: string;
  area: string;
  items: number;
  thumb: { product: Product; colorName: string; tint: string } | null;
  total: number;
  method: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  risky: boolean;
}

const BULK: { to: OrderStatus; label: string; Icon: typeof Truck; needsCancel?: boolean }[] = [
  { to: "confirmed", label: "Confirm", Icon: CheckCircle2 },
  { to: "printing", label: "Start printing", Icon: Printer },
  { to: "shipped", label: "Mark shipped", Icon: PackageOpen },
  { to: "delivered", label: "Mark delivered", Icon: Truck },
  { to: "cancelled", label: "Cancel", Icon: X, needsCancel: true },
];

function Thumb({ row }: { row: OrderRow }) {
  const product = row.thumb?.product;
  const color = product?.colors.find((c) => c.name === row.thumb?.colorName);
  return (
    <span
      className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-ink/10"
      style={{ backgroundColor: row.thumb?.tint ?? "#eee" }}
    >
      {product && <ProductVisual product={product} color={color} className="absolute inset-0.5" />}
      {row.items > 1 && (
        <span className="absolute bottom-0 right-0 rounded-tl-md bg-ink px-1 text-[9px] font-bold text-paper">+{row.items - 1}</span>
      )}
    </span>
  );
}

export function OrdersTable({ rows, canCancel, empty }: { rows: OrderRow[]; canCancel: boolean; empty: ReactNode }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.code));
  const toggle = (code: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const bulk = (to: OrderStatus, label: string) => {
    if (to === "cancelled" && !confirm(`Cancel ${selected.size} order(s)?`)) return;
    start(async () => {
      const res = await bulkStatusAction([...selected], to);
      setMessage(res.ok ? { ok: true, text: res.message ?? `${label} done.` } : { ok: false, text: res.error });
      if (res.ok) setSelected(new Set());
      router.refresh();
    });
  };

  return (
    <div>
      {(selected.size > 0 || message) && (
        <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-ink px-3 py-2.5 text-paper shadow-lg">
          {selected.size > 0 ? (
            <>
              <span className="px-1 text-sm font-semibold">{selected.size} selected</span>
              <div className="flex flex-wrap gap-1.5">
                {BULK.filter((b) => !b.needsCancel || canCancel).map((b) => (
                  <button
                    key={b.to}
                    disabled={pending}
                    onClick={() => bulk(b.to, b.label)}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors disabled:opacity-50",
                      b.to === "cancelled" ? "bg-shu/90 hover:bg-shu" : "bg-paper/10 hover:bg-paper/20",
                    )}
                  >
                    <b.Icon className="size-3.5" /> {b.label}
                  </button>
                ))}
              </div>
              {pending && <Loader2 className="size-4 animate-spin" />}
              <button onClick={() => setSelected(new Set())} className="ml-auto text-xs font-semibold text-paper/60 hover:text-paper">
                Clear
              </button>
            </>
          ) : (
            message && (
              <>
                <span className={cn("text-sm font-semibold", message.ok ? "text-paper" : "text-kin")}>{message.text}</span>
                <button onClick={() => setMessage(null)} className="ml-auto text-paper/60 hover:text-paper" aria-label="Dismiss">
                  <X className="size-4" />
                </button>
              </>
            )
          )}
        </div>
      )}

      {rows.length === 0 && <div className="rounded-2xl border border-ink/10 bg-white">{empty}</div>}

      {/* Desktop table */}
      <div className={cn("hidden overflow-hidden rounded-2xl border border-ink/10 bg-white", rows.length > 0 && "md:block")}>
        <table className="w-full text-sm">
          <thead className="border-b border-ink/[0.07] bg-paper/50 text-left text-xs text-ink/55">
            <tr>
              <th className="w-10 py-3 pl-4">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.code)))}
                  aria-label="Select all orders on this page"
                  className="size-4 accent-ink"
                />
              </th>
              <th className="px-3 py-3 font-semibold">Order</th>
              <th className="px-3 py-3 font-semibold">Customer</th>
              <th className="px-3 py-3 font-semibold">Items</th>
              <th className="px-3 py-3 text-right font-semibold">Total</th>
              <th className="px-3 py-3 font-semibold">Payment</th>
              <th className="px-3 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/[0.06]">
            {rows.map((r) => (
              <tr
                key={r.code}
                onClick={() => router.push(`/orders/${r.code}`)}
                className={cn("cursor-pointer transition-colors hover:bg-paper/60", selected.has(r.code) && "bg-kin/10")}
              >
                <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(r.code)}
                    onChange={() => toggle(r.code)}
                    aria-label={`Select ${r.code}`}
                    className="size-4 accent-ink"
                  />
                </td>
                <td className="px-3 py-3">
                  <Link href={`/orders/${r.code}`} onClick={(e) => e.stopPropagation()} className="font-mono font-semibold hover:text-shu">
                    {r.code}
                  </Link>
                  <p className="text-xs text-ink/50" title={r.placedAt}>
                    {r.ago}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <p className="flex items-center gap-1.5 font-medium">
                    {r.customer}
                    {r.risky && (
                      <span title="High risk: repeat cancels/returns" className="text-rose-600">
                        <ShieldAlert className="size-4" />
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink/50">
                    {r.phone} · {r.area}, {r.district}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Thumb row={r} />
                    <span className="text-xs text-ink/60">{r.items} item{r.items === 1 ? "" : "s"}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatBDT(r.total)}</td>
                <td className="px-3 py-3">
                  <p className="text-xs font-medium text-ink/70">{PAYMENT_LABEL[r.method]}</p>
                  <PaymentBadge status={r.paymentStatus} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {rows.map((r) => (
          <li key={r.code} className={cn("flex gap-3 rounded-2xl border border-ink/10 bg-white p-3", selected.has(r.code) && "border-ink/40 bg-kin/10")}>
            <input
              type="checkbox"
              checked={selected.has(r.code)}
              onChange={() => toggle(r.code)}
              aria-label={`Select ${r.code}`}
              className="mt-1 size-4 shrink-0 accent-ink"
            />
            <Link href={`/orders/${r.code}`} className="flex min-w-0 flex-1 gap-3">
              <Thumb row={r} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold">{r.code}</span>
                  <span className="text-sm font-semibold tabular-nums">{formatBDT(r.total)}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink/55">
                  {r.risky && <ShieldAlert className="size-3.5 shrink-0 text-rose-600" />}
                  {r.customer} · {r.district} · {r.ago}
                </span>
                <span className="mt-2 flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  <PaymentBadge status={r.paymentStatus} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
