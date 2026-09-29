import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Users } from "lucide-react";
import { can } from "@emrix/shared/admin";
import { fmtDate, timeAgo } from "@emrix/shared/time";
import { cn, formatBDT } from "@emrix/shared/utils";
import { EmptyState, PageHeader, RiskBadge, StatTile } from "@/components/ui";
import { ListFilters } from "@/components/list-filters";
import { NoAccess } from "@/components/no-access";
import { Pager } from "@/components/pager";
import { requireAdmin } from "@/lib/auth";
import { CUSTOMER_SORTS, type CustomerSort } from "@emrix/shared/api";
import { listCustomers } from "@/lib/backend";

export const metadata: Metadata = { title: "Customers" };

const PAGE_SIZE = 30;

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const admin = await requireAdmin();
  if (!can(admin.role, "customers:view")) return <NoAccess what="view the customer list" />;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const sort: CustomerSort = typeof sp.sort === "string" && (CUSTOMER_SORTS as readonly string[]).includes(sp.sort) ? (sp.sort as CustomerSort) : "recent";
  const { rows, total, repeat, spent, page, pages } = await listCustomers({ q, sort, page: Number(sp.page) || 1, pageSize: PAGE_SIZE });

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sort !== "recent") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/customers${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader jp="お客様" title="Customers" description="Everyone who has ordered, grouped by phone number." />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label={q ? "Matching customers" : "Customers"} value={total.toLocaleString("en-IN")} hint="unique phone numbers" />
        <StatTile label="Came back" value={total ? `${Math.round((repeat / total) * 100)}%` : "–"} hint={`${repeat} ordered more than once`} />
        <div className="col-span-2 lg:col-span-1">
          <StatTile label="Delivered sales" value={formatBDT(spent)} hint="lifetime, delivered orders only" />
        </div>
      </section>

      <div className="mb-4">
        <Suspense>
          <ListFilters
            placeholder="Search name, phone or district…"
            selects={[
              {
                key: "sort",
                label: "Sort: recent",
                aria: "Sort customers",
                options: [
                  ["orders", "Sort: most orders"],
                  ["spent", "Sort: top spenders"],
                ],
              },
            ]}
          />
        </Suspense>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-white">
          <EmptyState icon={<Users className="size-6" />} title={q ? "No customers match" : "No customers yet"}>
            {q ? "Try a different name or number." : "Customers appear here after their first order."}
          </EmptyState>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <table className="w-full text-sm">
            <thead className="hidden border-b border-ink/[0.07] bg-paper/50 text-left text-xs text-ink/55 md:table-header-group">
              <tr>
                <th className="py-3 pl-4 font-semibold">Customer</th>
                <th className="px-3 py-3 text-right font-semibold">Orders</th>
                <th className="px-3 py-3 text-right font-semibold">Delivered sales</th>
                <th className="px-3 py-3 font-semibold">Last order</th>
                <th className="px-3 py-3 pr-4 font-semibold">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.06]">
              {rows.map((c) => (
                <tr key={c.phone} className="group relative hover:bg-paper/60">
                  <td className="py-3 pl-4 pr-3">
                    <Link href={`/orders?q=${c.phone}`} className="block after:absolute after:inset-0">
                      <span className="block font-semibold group-hover:text-shu">{c.name}</span>
                      <span className="block text-xs text-ink/55">
                        <span className="font-mono">{c.phone}</span> · {c.district}
                        {c.email && <span className="hidden sm:inline"> · {c.email}</span>}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/55 md:hidden">
                        {c.orders} order{c.orders === 1 ? "" : "s"} · {formatBDT(c.spent)} · {timeAgo(c.lastOrderAt)}
                        {(c.risk === "high" || c.risk === "watch") && <RiskBadge risk={c.risk} />}
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-3 py-3 text-right tabular-nums md:table-cell">
                    <span className="font-semibold">{c.orders}</span>
                    {c.cancelled + c.returned > 0 && <span className="block text-xs text-rose-600">{c.cancelled + c.returned} failed</span>}
                  </td>
                  <td className="hidden px-3 py-3 text-right font-semibold tabular-nums md:table-cell">{formatBDT(c.spent)}</td>
                  <td className="hidden px-3 py-3 text-xs md:table-cell">
                    <span className="block font-semibold text-ink/80">{timeAgo(c.lastOrderAt)}</span>
                    <span className="text-ink/50">since {fmtDate(c.firstOrderAt)}</span>
                  </td>
                  <td className={cn("hidden px-3 py-3 pr-4 md:table-cell")}>
                    <RiskBadge risk={c.risk} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} pages={pages} total={total} pageSize={PAGE_SIZE} href={href} />
    </>
  );
}
