import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Download, Inbox } from "lucide-react";
import { can } from "@emrix/shared/admin";
import { STATUS_LABEL, type OrderStatus, type PaymentMethod, type PaymentStatus, type Zone } from "@emrix/shared/orders";
import { fmtDateTime, timeAgo } from "@emrix/shared/time";
import { cn } from "@emrix/shared/utils";
import { abtn, EmptyState, PageHeader } from "@/components/ui";
import { OrderFilters } from "@/components/orders/order-filters";
import { OrdersTable, type OrderRow } from "@/components/orders/orders-table";
import { requireAdmin } from "@/lib/auth";
import { STATUS_TABS } from "@emrix/shared/api";
import { findProductsByIds, getAllAnimes, listOrders, riskByPhone } from "@/lib/backend";

export const metadata: Metadata = { title: "Orders" };

const pick = <T extends string>(value: unknown, allowed: readonly T[]) =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const filter = {
    status: pick<OrderStatus | "all">(sp.status, STATUS_TABS) ?? "all",
    q: typeof sp.q === "string" ? sp.q : undefined,
    payment: pick<PaymentMethod>(sp.payment, ["cod", "bkash", "nagad"]),
    paymentStatus: pick<PaymentStatus>(sp.paymentStatus, ["unpaid", "pending", "paid", "failed", "refunded"]),
    zone: pick<Zone>(sp.zone, ["inside", "outside"]),
    page: Number(sp.page) || 1,
  };
  const { rows, total, page, pages, counts } = await listOrders(filter);
  const [products, animes, risks] = await Promise.all([
    findProductsByIds(rows.flatMap((o) => o.lines.slice(0, 1).map((l) => l.productId))),
    getAllAnimes(),
    riskByPhone(rows.filter((o) => o.status === "placed").map((o) => o.customer.phone)),
  ]);

  const qs = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { ...filter, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "" && !(k === "status" && v === "all") && !(k === "page" && v === 1)) p.set(k, String(v));
    }
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  const tableRows: OrderRow[] = rows.map((o) => ({
    code: o.code,
    placedAt: fmtDateTime(o.createdAt),
    ago: timeAgo(o.createdAt),
    customer: o.customer.name,
    phone: o.customer.phone,
    district: o.shipping.district,
    area: o.shipping.area,
    items: o.lines.reduce((n, l) => n + l.qty, 0),
    thumb: (() => {
      const line = o.lines[0];
      const product = line && products.find((p) => p.id === line.productId);
      return product ? { product, colorName: line.colorName, tint: animes.find((a) => a.slug === product.anime)?.tint ?? "#eee" } : null;
    })(),
    total: o.total,
    method: o.payment.method,
    paymentStatus: o.paymentStatus,
    status: o.status,
    risky: o.status === "placed" && risks.get(o.customer.phone) === "high",
  }));

  return (
    <>
      <PageHeader
        jp="注文管理"
        title="Orders"
        description={`${counts.all} orders${filter.q || filter.payment || filter.paymentStatus || filter.zone ? " match your filters" : " in total"}.`}
        actions={
          <a href={`/orders/export${qs({ page: undefined })}`} className={abtn("outline")}>
            <Download className="size-4" /> Export CSV
          </a>
        }
      />

      <nav className="no-scrollbar -mx-4 mb-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Order status">
        {STATUS_TABS.map((s) => {
          const active = filter.status === s;
          return (
            <Link
              key={s}
              href={`/orders${qs({ status: s, page: 1 })}`}
              scroll={false}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                active ? "bg-ink text-paper" : "text-ink/60 hover:bg-white hover:text-ink",
              )}
              aria-current={active ? "page" : undefined}
            >
              {s === "all" ? "All" : STATUS_LABEL[s]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  active ? "bg-paper/20" : s === "placed" && counts.placed > 0 ? "bg-shu text-white" : "bg-ink/[0.06]",
                )}
              >
                {counts[s]}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mb-4">
        <Suspense>
          <OrderFilters />
        </Suspense>
      </div>

      <OrdersTable
        rows={tableRows}
        canCancel={can(admin.role, "orders:cancel")}
        empty={
          <EmptyState icon={<Inbox className="size-6" />} title="No orders here">
            Try another status tab or clear your filters.
          </EmptyState>
        }
      />

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-ink/55">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Link
              href={`/orders${qs({ page: page - 1 })}`}
              aria-disabled={page <= 1}
              className={cn(abtn("outline", "h-9 px-3"), page <= 1 && "pointer-events-none opacity-40")}
            >
              <ChevronLeft className="size-4" /> Prev
            </Link>
            <Link
              href={`/orders${qs({ page: page + 1 })}`}
              aria-disabled={page >= pages}
              className={cn(abtn("outline", "h-9 px-3"), page >= pages && "pointer-events-none opacity-40")}
            >
              Next <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
