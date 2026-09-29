import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Boxes } from "lucide-react";
import { can } from "@emrix/shared/admin";
import { SIZES, stockOf, totalStock } from "@emrix/shared/catalog";
import { timeAgo } from "@emrix/shared/time";
import { cn, formatBDT } from "@emrix/shared/utils";
import { Card, EmptyState, PageHeader, StatTile } from "@/components/ui";
import { ListFilters } from "@/components/list-filters";
import { InventoryControls, ReasonPicker, StockGrid } from "@/components/inventory/stock-grid";
import { ProductVisual } from "@emrix/shared/ui/product-visual";
import { requireAdmin } from "@/lib/auth";
import type { StockReason } from "@emrix/shared/records";
import { getAllAnimes, getAllProducts, recentStockMovements } from "@/lib/backend";

export const metadata: Metadata = { title: "Inventory" };

const REASON_LABEL: Record<StockReason, string> = {
  order: "Order",
  cancelled: "Cancelled order",
  returned: "Returned order",
  restock: "Restock",
  damaged: "Damaged / lost",
  correction: "Correction",
};

export default async function InventoryPage({ searchParams }: PageProps<"/inventory">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const [allProducts, animes, movements] = await Promise.all([getAllProducts(), getAllAnimes(), recentStockMovements(25)]);
  const canEdit = can(admin.role, "inventory:adjust");
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";

  const summaries = allProducts
    .filter((p) => p.status !== "archived")
    .map((p) => {
      const cells = p.colors.flatMap((c) => SIZES.map((s) => stockOf(p, c.name, s)));
      return {
        p,
        cells: cells.length,
        pOut: cells.filter((n) => n === 0).length,
        pLow: cells.filter((n) => n > 0 && n <= p.lowStockAt).length,
        units: totalStock(p),
      };
    });
  const variants = summaries.reduce((n, x) => n + x.cells, 0);
  const low = summaries.reduce((n, x) => n + x.pLow, 0);
  const out = summaries.reduce((n, x) => n + x.pOut, 0);
  const units = summaries.reduce((n, x) => n + x.units, 0);
  const value = summaries.reduce((n, x) => n + x.units * x.p.price, 0);
  const products = summaries
    .filter(({ p, pLow, pOut }) => {
      if (sp.anime && p.anime !== sp.anime) return false;
      if (sp.state === "low" && !pLow) return false;
      if (sp.state === "out" && !pOut) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => b.pOut * 10 + b.pLow - (a.pOut * 10 + a.pLow));


  return (
    <InventoryControls>
      <PageHeader jp="在庫管理" title="Inventory" description="Stock per colour and size. Edit a number and press Enter; every change is logged." />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Units in stock" value={units.toLocaleString("en-IN")} hint={`${variants} variants`} />
        <StatTile label="Running low" value={String(low)} hint="variants at or under alert level" />
        <StatTile label="Sold out" value={String(out)} hint="variants with zero stock" />
        {can(admin.role, "revenue:view") ? (
          <StatTile label="Stock value" value={formatBDT(value)} hint="at selling price" />
        ) : (
          <StatTile label="Products tracked" value={String(products.length)} hint="active & draft" />
        )}
      </section>

      <div className="mb-4 mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Suspense>
          <ListFilters
            placeholder="Search products…"
            selects={[
              { key: "anime", label: "Anime", aria: "Anime collection", options: animes.map((a) => [a.slug, a.name] as const) },
              { key: "state", label: "Stock", aria: "Stock level", options: [["low", "Running low"], ["out", "Sold out sizes"]] },
            ]}
          />
        </Suspense>
        {canEdit && <ReasonPicker />}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 space-y-3 xl:col-span-2">
          {products.length === 0 && (
            <div className="rounded-2xl border border-ink/10 bg-white">
              <EmptyState icon={<Boxes className="size-6" />} title="Nothing matches">
                Everything here is healthy, or your filters are too narrow.
              </EmptyState>
            </div>
          )}
          {products.map(({ p, pLow, pOut }) => {
            const anime = animes.find((a) => a.slug === p.anime);
            return (
              <section key={p.id} className="rounded-2xl border border-ink/10 bg-white p-4">
                <header className="mb-3 flex items-center gap-3">
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-ink/10" style={{ backgroundColor: anime?.tint }}>
                    <ProductVisual product={p} className="absolute inset-0.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${p.id}`} className="block truncate font-semibold hover:text-shu">
                      {p.name}
                    </Link>
                    <p className="text-xs text-ink/55">
                      {anime?.name} · {totalStock(p)} units · alert at {p.lowStockAt}
                      {p.status === "draft" && " · draft"}
                    </p>
                  </div>
                  <span className="flex shrink-0 gap-1">
                    {pOut > 0 && <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700">{pOut} out</span>}
                    {pLow > 0 && <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">{pLow} low</span>}
                  </span>
                </header>
                <StockGrid productId={p.id} colors={p.colors} stock={p.stock} lowAt={p.lowStockAt} canEdit={canEdit} />
              </section>
            );
          })}
        </div>

        <Card title="Stock history" className="self-start xl:sticky xl:top-20" bodyClassName="p-0">
          {movements.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink/55">No movements yet. Orders, cancellations and your edits appear here.</p>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-ink/[0.06] overflow-y-auto">
              {movements.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span
                    className={cn(
                      "w-11 shrink-0 rounded-md py-0.5 text-center text-xs font-bold tabular-nums",
                      m.delta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                    )}
                  >
                    {m.delta > 0 ? "+" : ""}
                    {m.delta}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{m.product}</span>
                    <span className="block truncate text-xs text-ink/50">
                      {m.color} · {m.size} · {REASON_LABEL[m.reason]}
                      {m.ref ? ` ${m.ref}` : ""} · {m.actor ?? "Customer"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs text-ink/50">
                    <span className="block font-semibold text-ink/70">→ {m.after}</span>
                    {timeAgo(m.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </InventoryControls>
  );
}
