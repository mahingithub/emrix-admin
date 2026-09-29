import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2, Circle, CircleDot, PackageOpen, Printer, Rocket, Truck, Wallet } from "lucide-react";
import { can } from "@emrix/shared/admin";
import { STATUS_LABEL } from "@emrix/shared/orders";
import { formatDhaka, timeAgo } from "@emrix/shared/time";
import { cn, formatBDT } from "@emrix/shared/utils";
import { Card, PageHeader, PaymentBadge, StatTile, StatusBadge } from "@/components/ui";
import { PaymentMix } from "@/components/payment-mix";
import { SalesChart } from "@/components/sales-chart";
import { requireAdmin } from "@/lib/auth";
import { RANGES, type LaunchStatus, type RangeKey } from "@emrix/shared/api";
import { getDashboard, getLaunchStatus } from "@/lib/backend";

export const metadata: Metadata = { title: "Dashboard" };

interface LaunchStep {
  label: string;
  hint: string;
  href: string;
  done: boolean;
}

/** What an owner still needs to set up before (or soon after) opening the shop. */
function launchSteps(s: LaunchStatus): LaunchStep[] {
  return [
    { label: "Add your shop phone number", hint: "Shown in the footer, help page and on invoices.", href: "/settings", done: s.phone },
    { label: "Add a bKash or Nagad number", hint: "Until then, checkout offers Cash on Delivery only.", href: "/settings", done: s.wallet },
    { label: "Put your first product on sale", hint: "An active product with stock. Import the launch designs from Products.", href: "/products", done: s.product },
    { label: "Link your Facebook page or Messenger", hint: "Customers use these to ask questions and request designs.", href: "/settings", done: s.social },
    { label: "Add your team", hint: "Give each person their own login, so the activity log shows who did what.", href: "/staff", done: s.team },
  ];
}

function greeting() {
  const h = Number(formatDhaka(Date.now(), { hour: "numeric", hour12: false }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const admin = await requireAdmin();
  const { range: rawRange } = await searchParams;
  const range: RangeKey = rawRange === "7d" || rawRange === "90d" ? rawRange : "30d";
  const [d, launch] = await Promise.all([getDashboard(range), admin.role === "owner" ? getLaunchStatus() : null]);
  const checklist = launch && launchSteps(launch);
  const money = can(admin.role, "revenue:view");

  const attention = [
    { label: "New orders to confirm", count: d.attention.toConfirm, href: "/orders?status=placed", Icon: CircleDot },
    { label: "Payments to verify", count: d.attention.toVerify, href: "/orders?paymentStatus=pending", Icon: Wallet },
    { label: "To print & pack", count: d.attention.toPrint, href: "/orders?status=confirmed", Icon: Printer },
    { label: "Ready to ship", count: d.attention.toShip, href: "/orders?status=printing", Icon: PackageOpen },
    { label: "Out for delivery", count: d.attention.inTransit, href: "/orders?status=shipped", Icon: Truck },
  ];
  const period = `vs previous ${d.days} days`;
  const maxProduct = Math.max(1, ...d.topProducts.map((p) => p.units));
  const animeMeasure = (a: (typeof d.topAnime)[number]) => (money ? a.revenue : a.units);
  const districtMeasure = (x: (typeof d.districts)[number]) => (money ? x.sales : x.orders);
  const maxAnime = Math.max(1, ...d.topAnime.map(animeMeasure));
  const maxDistrict = Math.max(1, ...d.districts.map(districtMeasure));
  const maxPipe = Math.max(1, ...d.pipeline.map((p) => p.count));
  const zoneTotal = d.zones.inside + d.zones.outside;
  const insidePct = zoneTotal ? Math.round((d.zones.inside / zoneTotal) * 100) : 0;

  return (
    <>
      <PageHeader
        jp="ダッシュボード"
        title="Dashboard"
        description={
          <>
            {greeting()}, {admin.name.split(" ")[0]}. Today so far:{" "}
            <b className="text-ink">
              {d.today.orders} order{d.today.orders === 1 ? "" : "s"}
            </b>
            {money && (
              <>
                {" "}
                worth <b className="text-ink">{formatBDT(d.today.sales)}</b>
              </>
            )}
            .
          </>
        }
        actions={
          <Link href="/orders?status=placed" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/85">
            Process new orders <ArrowRight className="size-4" />
          </Link>
        }
      />

      {checklist && checklist.some((s) => !s.done) && <LaunchChecklist steps={checklist} />}

      {/* Needs attention: live, not range-scoped */}
      <section aria-label="Needs attention" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {attention.map(({ label, count, href, Icon }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-2xl border bg-white p-3.5 transition-colors hover:border-ink/40",
              count > 0 ? "border-ink/10" : "border-ink/[0.06] opacity-70",
            )}
          >
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", count > 0 ? "bg-kin/40 text-ink" : "bg-paper text-ink/40")}>
              <Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xl font-bold leading-none">{count}</span>
              <span className="mt-1 block truncate text-xs text-ink/60">{label}</span>
            </span>
          </Link>
        ))}
      </section>

      {/* One filter row scopes everything below */}
      <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink/60">Performance</h2>
        <div className="inline-flex rounded-xl border border-ink/10 bg-white p-1 text-sm font-semibold" role="group" aria-label="Date range">
          {(Object.keys(RANGES) as RangeKey[]).map((r) => (
            <Link
              key={r}
              href={`/?range=${r}`}
              scroll={false}
              className={cn("rounded-lg px-3 py-1.5", r === range ? "bg-ink text-paper" : "text-ink/60 hover:text-ink")}
              aria-current={r === range ? "true" : undefined}
            >
              Last {RANGES[r]} days
            </Link>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Key figures">
        {money ? (
          <>
            <StatTile label="Sales" value={formatBDT(d.kpis.sales.value)} delta={d.kpis.sales.delta} deltaLabel={period} />
            <StatTile label="Orders" value={d.kpis.orders.value.toLocaleString("en-IN")} delta={d.kpis.orders.delta} deltaLabel={period} />
            <StatTile label="Average order value" value={formatBDT(d.kpis.aov.value)} delta={d.kpis.aov.delta} deltaLabel={period} />
          </>
        ) : (
          <>
            <StatTile label="Orders" value={d.kpis.orders.value.toLocaleString("en-IN")} delta={d.kpis.orders.delta} deltaLabel={period} />
            <StatTile label="T-shirts sold" value={d.kpis.items.toLocaleString("en-IN")} hint={`last ${d.days} days`} />
            <StatTile label="Cancelled" value={String(d.kpis.orders.cancelled)} hint={`last ${d.days} days`} />
          </>
        )}
        <StatTile
          label="Delivery success"
          value={d.kpis.success.value === null ? "—" : `${Math.round(d.kpis.success.value)}%`}
          delta={d.kpis.success.delta}
          deltaUnit=" pts"
          deltaLabel={period}
          hint="delivered vs returned"
        />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card title={money ? "Sales" : "Orders"} className="xl:col-span-8">
          <SalesChart data={d.daily} metric={money ? "sales" : "orders"} />
        </Card>

        <Card title="Order pipeline" className="xl:col-span-4" action={<span className="text-xs text-ink/50">last {d.days} days</span>}>
          <ul className="space-y-3">
            {d.pipeline.map((p) => (
              <li key={p.status}>
                <Link href={`/orders?status=${p.status}`} className="group block">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink/75 group-hover:text-ink">{STATUS_LABEL[p.status]}</span>
                    <span className="font-semibold tabular-nums">{p.count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-ink/[0.06]">
                    <div className="h-full rounded-full bg-ink/80" style={{ width: `${(p.count / maxPipe) * 100}%` }} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card title="Top designs" action={<span className="text-xs text-ink/50">by T-shirts sold</span>}>
          <RankList
            rows={d.topProducts.map((p) => ({
              key: p.id,
              label: p.name,
              sub: p.animeName,
              value: `${p.units} sold`,
              ratio: p.units / maxProduct,
            }))}
          />
        </Card>
        <Card title="Top anime" action={<span className="text-xs text-ink/50">{money ? "by sales" : "by units"}</span>}>
          <RankList
            rows={d.topAnime.map((a) => ({
              key: a.slug,
              label: a.name,
              sub: `${a.units} T-shirts`,
              value: money ? formatBDT(a.revenue) : `${a.units}`,
              ratio: animeMeasure(a) / maxAnime,
              badge: a.kanji,
            }))}
          />
        </Card>
        <Card title="Payment methods" action={<span className="text-xs text-ink/50">share of orders</span>}>
          <PaymentMix data={d.payments} showMoney={money} />
          <div className="mt-6 border-t border-ink/[0.07] pt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/75">Inside Dhaka</span>
              <span className="font-semibold tabular-nums">{insidePct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#cde2fb]" role="img" aria-label={`Inside Dhaka ${insidePct}% of sales`}>
              <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${insidePct}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink/50">
              {100 - insidePct}% of {money ? "sales" : "orders"} ship outside Dhaka.
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card
          title="Latest orders"
          className="xl:col-span-8"
          bodyClassName="p-0"
          action={
            <Link href="/orders" className="text-xs font-semibold text-ink/60 hover:text-ink">
              View all →
            </Link>
          }
        >
          <ul className="divide-y divide-ink/[0.06]">
            {d.recent.map((o) => (
              <li key={o.code}>
                <Link href={`/orders/${o.code}`} className="flex items-center gap-3 px-5 py-3 hover:bg-paper/60">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{o.code}</span>
                      <StatusBadge status={o.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink/55">
                      {o.customer.name} · {o.shipping.district} · {timeAgo(o.createdAt)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-semibold tabular-nums">{formatBDT(o.total)}</span>
                    <PaymentBadge status={o.paymentStatus} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-4 xl:col-span-4">
        <Card
          title="Low stock"
          action={
            <Link href="/inventory?state=low" className="text-xs font-semibold text-ink/60 hover:text-ink">
              Inventory →
            </Link>
          }
        >
          {d.lowStock.count === 0 ? (
            <p className="text-sm text-ink/55">Every size is well stocked.</p>
          ) : (
            <>
              <p className="mb-3 text-xs text-ink/55">
                {d.lowStock.out} sold out · {d.lowStock.count - d.lowStock.out} running low
              </p>
              <ul className="space-y-2">
                {d.lowStock.top.map((v) => (
                  <li key={`${v.productId}-${v.color}-${v.size}`}>
                    <Link href={`/products/${v.productId}`} className="flex items-center gap-3 rounded-lg px-1 py-1 text-sm hover:bg-paper">
                      <span
                        className={cn(
                          "w-14 shrink-0 rounded-md py-0.5 text-center text-xs font-bold",
                          v.left === 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800",
                        )}
                      >
                        {v.left === 0 ? "Out" : `${v.left} left`}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{v.name}</span>
                      <span className="shrink-0 text-xs text-ink/55">
                        {v.color} · {v.size}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <Card title="Top districts" action={<span className="text-xs text-ink/50">{money ? "by sales" : "by orders"}</span>}>
          <RankList
            rows={d.districts.map((x) => ({
              key: x.name,
              label: x.name,
              sub: `${x.orders} orders`,
              value: money ? formatBDT(x.sales) : `${x.orders}`,
              ratio: districtMeasure(x) / maxDistrict,
            }))}
          />
          <p className="mt-4 flex items-center gap-1.5 text-xs text-ink/50">
            <BadgeCheck className="size-3.5" /> Cancelled orders are excluded from sales figures.
          </p>
        </Card>
        </div>
      </div>
    </>
  );
}

function RankList({
  rows,
}: {
  rows: { key: string; label: string; sub: string; value: string; ratio: number; badge?: string }[];
}) {
  if (!rows.length) return <p className="text-sm text-ink/55">No sales in this period.</p>;
  return (
    <ol className="space-y-3.5">
      {rows.map((r, i) => (
        <li key={r.key} className="flex items-center gap-3">
          <span className="w-4 text-xs font-semibold tabular-nums text-ink/40">{i + 1}</span>
          {r.badge && (
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-paper font-jp text-sm font-black">{r.badge}</span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium">{r.label}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{r.value}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-ink/[0.06]">
                <div className="h-full rounded-full bg-ink/80" style={{ width: `${Math.max(2, r.ratio * 100)}%` }} />
              </div>
              <span className="w-20 shrink-0 text-right text-[11px] text-ink/45">{r.sub}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function LaunchChecklist({ steps }: { steps: LaunchStep[] }) {
  const done = steps.filter((s) => s.done).length;
  return (
    <Card
      className="mb-6"
      title={
        <span className="inline-flex items-center gap-2">
          <Rocket className="size-4 text-shu" /> Before you launch
        </span>
      }
      action={<span className="text-xs font-semibold text-ink/55">{done} of {steps.length} done</span>}
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-ink/[0.06]">
        {steps.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className={cn("flex items-start gap-3 px-5 py-3 hover:bg-paper/60", s.done && "opacity-55")}>
              {s.done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 size-5 shrink-0 text-ink/25" />}
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-semibold", s.done && "line-through")}>{s.label}</span>
                {!s.done && <span className="block text-xs text-ink/55">{s.hint}</span>}
              </span>
              {!s.done && <ArrowRight className="mt-0.5 size-4 shrink-0 text-ink/35" />}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
