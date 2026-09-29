import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Package, PackagePlus, Plus, Rocket } from "lucide-react";
import { can } from "@emrix/shared/admin";
import { fitShort, SIZES, stockOf, totalStock } from "@emrix/shared/catalog";
import { bundledProductPhotos } from "@emrix/shared/catalog-media";
import type { Product } from "@emrix/shared/types";
import { cn, formatBDT } from "@emrix/shared/utils";
import { abtn, Card, EmptyState, PageHeader } from "@/components/ui";
import { ActionButton } from "@/components/action-button";
import { ListFilters } from "@/components/list-filters";
import { BulkPhotoUpload } from "@/components/products/bulk-photo-upload";
import { ProductVisual } from "@emrix/shared/ui/product-visual";
import { importStarterCatalogAction, publishReadyDraftsAction } from "@/actions/catalog";
import { requireAdmin } from "@/lib/auth";
import { getAllAnimes, getAllProducts, starterCatalogGap } from "@/lib/backend";

export const metadata: Metadata = { title: "Products" };

function stockSummary(p: Product) {
  let low = 0;
  let out = 0;
  for (const c of p.colors) {
    for (const s of SIZES) {
      const n = stockOf(p, c.name, s);
      if (n === 0) out++;
      else if (n <= p.lowStockAt) low++;
    }
  }
  return { total: totalStock(p), low, out };
}

const STATUS_STYLE: Record<Product["status"], string> = {
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  draft: "bg-amber-50 text-amber-800 ring-amber-200",
  archived: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

const photoLabel = (p: Product) =>
  p.images.length ? `${p.images.length} photo${p.images.length === 1 ? "" : "s"}` : bundledProductPhotos(p).length ? "launch mockup" : "no photos yet";

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const [products, animes, gap] = await Promise.all([getAllProducts(), getAllAnimes(), starterCatalogGap()]);
  const editable = can(admin.role, "products:edit");
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";
  const animeOf = (slug: string) => animes.find((a) => a.slug === slug);

  const rows = products
    .map((p) => ({ p, stock: stockSummary(p), anime: animeOf(p.anime) }))
    .filter(({ p, stock, anime }) => {
      if (sp.anime && p.anime !== sp.anime) return false;
      if (sp.status && p.status !== sp.status) return false;
      if (sp.stock === "low" && !stock.low) return false;
      if (sp.stock === "out" && !stock.out) return false;
      if (q && !`${p.name} ${p.slug} ${anime?.name}`.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => (b.p.updatedAt ?? b.p.createdAt).localeCompare(a.p.updatedAt ?? a.p.createdAt));

  const counts = {
    active: products.filter((p) => p.status === "active").length,
    draft: products.filter((p) => p.status === "draft").length,
    archived: products.filter((p) => p.status === "archived").length,
  };
  const readyDrafts = products.filter((p) => p.status === "draft" && totalStock(p) > 0).length;

  return (
    <>
      <PageHeader
        jp="商品管理"
        title="Products"
        description={`${counts.active} active · ${counts.draft} draft · ${counts.archived} archived`}
        actions={
          editable && (
            <>
              {readyDrafts > 0 && (
                <ActionButton
                  action={publishReadyDraftsAction}
                  confirm={`Put ${readyDrafts} draft product${readyDrafts === 1 ? "" : "s"} that have stock on sale now?`}
                  align="end"
                >
                  <Rocket className="size-4" /> Publish {readyDrafts} ready draft{readyDrafts === 1 ? "" : "s"}
                </ActionButton>
              )}
              {products.length > 0 && (
                <BulkPhotoUpload products={products.map((p) => ({ id: p.id, name: p.name, slug: p.slug, colors: p.colors }))} />
              )}
              <Link href="/products/new" className={abtn("accent")}>
                <Plus className="size-4" /> Add product
              </Link>
            </>
          )
        }
      />

      {editable && gap.products > 0 && (
        <Card className="mb-4" bodyClassName="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-kin/40">
              <PackagePlus className="size-5" />
            </span>
            <div>
              <p className="font-semibold">{products.length ? "Some launch designs aren't imported" : "Start with the EMRIX launch designs"}</p>
              <p className="mt-0.5 max-w-xl text-sm text-ink/60">
                Import {gap.products} ready-made product{gap.products === 1 ? "" : "s"}
                {gap.animes > 0 && ` and ${gap.animes} anime collection${gap.animes === 1 ? "" : "s"}`}, with their photos. They arrive
                as drafts with 0 stock and no reviews or sales, so nothing goes on sale until you add stock and publish.
              </p>
            </div>
          </div>
          <ActionButton action={importStarterCatalogAction} variant="primary" className="shrink-0">
            Import starter catalogue
          </ActionButton>
        </Card>
      )}

      {products.length > 0 && (
        <div className="mb-4">
          <Suspense>
            <ListFilters
              placeholder="Search products…"
              selects={[
                { key: "anime", label: "Anime", aria: "Anime collection", options: animes.map((a) => [a.slug, a.name] as const) },
                { key: "status", label: "Status", aria: "Status", options: [["active", "Active"], ["draft", "Draft"], ["archived", "Archived"]] },
                { key: "stock", label: "Stock", aria: "Stock level", options: [["low", "Running low"], ["out", "Has sold-out sizes"]] },
              ]}
            />
          </Suspense>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-white">
          {products.length === 0 ? (
            <EmptyState icon={<Package className="size-6" />} title="No products yet">
              {editable
                ? animes.length
                  ? "Add your first product, or import the launch designs above."
                  : "Create an anime collection first (Anime in the menu), then add products. Or import the launch designs above."
                : "An owner or manager adds products here."}
            </EmptyState>
          ) : (
            <EmptyState icon={<Package className="size-6" />} title="No products match">
              Try clearing filters{editable ? ", or add a new product." : "."}
            </EmptyState>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <table className="w-full text-sm">
            <thead className="hidden border-b border-ink/[0.07] bg-paper/50 text-left text-xs text-ink/55 md:table-header-group">
              <tr>
                <th className="py-3 pl-4 font-semibold">Product</th>
                <th className="px-3 py-3 text-right font-semibold">Price</th>
                <th className="px-3 py-3 font-semibold">Stock</th>
                <th className="px-3 py-3 text-right font-semibold">Sold</th>
                <th className="px-3 py-3 pr-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.06]">
              {rows.map(({ p, stock, anime }) => (
                <tr key={p.id} className="group relative hover:bg-paper/60">
                  {/* w-full + max-w-0 lets long names truncate instead of pushing the price off screen. */}
                  <td className="w-full max-w-0 py-3 pl-4 pr-3">
                    <Link href={`/products/${p.id}`} className="flex items-center gap-3 after:absolute after:inset-0">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-ink/10" style={{ backgroundColor: anime?.tint }}>
                        <ProductVisual product={p} className="absolute inset-0.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold group-hover:text-shu">{p.name}</span>
                        <span className="block truncate text-xs text-ink/55">
                          {anime?.name} · {fitShort(p.fit)} · {photoLabel(p)}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1 md:hidden">
                          {p.status !== "active" && (
                            <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset", STATUS_STYLE[p.status])}>
                              {p.status}
                            </span>
                          )}
                          <StockChips stock={stock} />
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right align-middle">
                    <span className="font-semibold tabular-nums">{formatBDT(p.price)}</span>
                    {p.compareAt && <s className="block text-xs text-ink/40">{formatBDT(p.compareAt)}</s>}
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <span className="font-semibold tabular-nums">{stock.total}</span> <span className="text-xs text-ink/50">units</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      <StockChips stock={stock} />
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-right tabular-nums md:table-cell">{p.sold.toLocaleString("en-IN")}</td>
                  <td className="hidden px-3 py-3 pr-4 md:table-cell">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset", STATUS_STYLE[p.status])}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function StockChips({ stock }: { stock: { total: number; low: number; out: number } }) {
  if (stock.total === 0) return <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700">No stock</span>;
  return (
    <>
      {stock.out > 0 && <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700">{stock.out} sold out</span>}
      {stock.low > 0 && <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">{stock.low} low</span>}
      {!stock.out && !stock.low && <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">Healthy</span>}
    </>
  );
}
