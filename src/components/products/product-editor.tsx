"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { Archive, ExternalLink, Film, Loader2, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { COLOR_PRESETS, FIT_LABEL, MOTIFS, SIZES } from "@emrix/shared/catalog";
import type { Anime, Badge, Fit, Motif, Product, ProductImage, ProductStatus, ProductVideo, Size } from "@emrix/shared/types";
import { cn, discountPercent, formatBDT } from "@emrix/shared/utils";
import { ProductVisual } from "@emrix/shared/ui/product-visual";
import { deleteProductAction, saveProductAction } from "@/actions/catalog";
import { abtn, Card } from "../ui";
import { PhotoManager, uploadVideo } from "../uploads";
import { shopUrl } from "@/lib/shop";

interface ColorRow {
  uid: string;
  name: string;
  hex: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const input =
  "h-10 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none transition-colors placeholder:text-ink/35 focus:border-ink";

const STATUS: { value: ProductStatus; label: string; hint: string }[] = [
  { value: "active", label: "Active", hint: "Visible and for sale in the shop" },
  { value: "draft", label: "Draft", hint: "Hidden while you prepare it" },
  { value: "archived", label: "Archived", hint: "Hidden, kept for order history" },
];

const BADGES: { value: Badge; label: string }[] = [
  { value: "new", label: "New" },
  { value: "bestseller", label: "Bestseller" },
  { value: "limited", label: "Limited" },
];

export function ProductEditor({
  product,
  animes,
  hasOrders,
}: {
  product: Product | null;
  animes: Anime[];
  hasOrders: boolean;
}) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const initialColors: ColorRow[] = (product?.colors ?? [COLOR_PRESETS[0]]).map((c) => ({ uid: uid(), ...c }));
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [jp, setJp] = useState(product?.jp ?? "");
  const [anime, setAnime] = useState(product?.anime ?? animes[0]?.slug ?? "");
  const [fit, setFit] = useState<Fit>(product?.fit ?? "regular");
  const [description, setDescription] = useState(product?.description ?? "");
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "draft");
  const [price, setPrice] = useState(String(product?.price ?? 650));
  const [compareAt, setCompareAt] = useState(product?.compareAt ? String(product.compareAt) : "");
  const [badges, setBadges] = useState<Badge[]>(product?.badges ?? ["new"]);
  const [lowStockAt, setLowStockAt] = useState(String(product?.lowStockAt ?? 5));
  const [colors, setColors] = useState<ColorRow[]>(initialColors);
  const [stock, setStock] = useState<Record<string, Partial<Record<Size, number>>>>(() =>
    Object.fromEntries(initialColors.map((c) => [c.uid, { ...(product?.stock[c.name] ?? {}) }])),
  );
  const [images, setImagesRaw] = useState<ProductImage[]>(product?.images ?? []);
  const [video, setVideo] = useState<ProductVideo | undefined>(product?.video);
  const [art, setArt] = useState(product?.art ?? { kanji: "忍", sub: "NEW DROP", motif: "hinomaru" as Motif, accent: "#e5322b" });
  const [fillAll, setFillAll] = useState("");

  // Track unsaved changes (and warn before leaving the page).
  const touch = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };
  const setImages = (next: ProductImage[] | ((prev: ProductImage[]) => ProductImage[])) => {
    setImagesRaw(next);
    setDirty(true);
  };
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const animeRecord = animes.find((a) => a.slug === anime);
  const priceNum = Number(price) || 0;
  const compareNum = Number(compareAt) || undefined;
  const preview: Product = useMemo(
    () => ({
      id: product?.id ?? "preview",
      slug,
      name: name || "Untitled design",
      jp,
      anime,
      fit,
      price: priceNum,
      compareAt: compareNum,
      colors: colors.map((c) => ({ name: c.name || "Colour", hex: c.hex })),
      badges,
      rating: 0,
      reviews: 0,
      sold: 0,
      createdAt: "",
      description,
      status,
      images,
      stock: {},
      lowStockAt: Number(lowStockAt) || 0,
      art,
    }),
    [product?.id, slug, name, jp, anime, fit, priceNum, compareNum, colors, badges, description, status, images, lowStockAt, art],
  );

  const renameColor = (row: ColorRow, nextName: string) => {
    setImagesRaw((imgs) => imgs.map((i) => (i.color === row.name ? { ...i, color: nextName || undefined } : i)));
    setColors((cs) => cs.map((c) => (c.uid === row.uid ? { ...c, name: nextName } : c)));
    setDirty(true);
  };
  const addColor = (preset?: { name: string; hex: string }) => {
    const row = { uid: uid(), name: preset?.name ?? "", hex: preset?.hex ?? "#888888" };
    setColors((cs) => [...cs, row]);
    setStock((s) => ({ ...s, [row.uid]: {} }));
    setDirty(true);
  };
  const removeColor = (row: ColorRow) => {
    setColors((cs) => cs.filter((c) => c.uid !== row.uid));
    setImagesRaw((imgs) => imgs.map((i) => (i.color === row.name ? { ...i, color: undefined } : i)));
    setDirty(true);
  };
  const setCell = (rowUid: string, size: Size, value: string) => {
    const n = Math.max(0, Math.min(9999, Math.round(Number(value) || 0)));
    setStock((s) => ({ ...s, [rowUid]: { ...s[rowUid], [size]: n } }));
    setDirty(true);
  };

  const save = () =>
    startSave(async () => {
      setNotice(null);
      const res = await saveProductAction(product?.id ?? null, {
        name: name.trim(),
        slug,
        jp: jp.trim(),
        anime,
        fit,
        price: Math.round(priceNum),
        compareAt: compareNum ? Math.round(compareNum) : undefined,
        colors: colors.map((c) => ({ name: c.name.trim(), hex: c.hex })),
        badges,
        description: description.trim(),
        status,
        images: images.map((i) => ({ ...i, alt: i.alt || `${name}${i.color ? ` in ${i.color}` : ""}` })),
        // Keep the colour tag only while that colour is still on sale.
        video: video && { ...video, color: colors.some((c) => c.name.trim() === video.color) ? video.color : undefined },
        stock: Object.fromEntries(colors.map((c) => [c.name.trim(), stock[c.uid] ?? {}])),
        lowStockAt: Math.max(0, Math.round(Number(lowStockAt) || 0)),
        art: { ...art, kanji: art.kanji.trim(), sub: art.sub.trim().toUpperCase() },
      });
      if (!res.ok) {
        setNotice({ ok: false, text: res.error });
        return;
      }
      setDirty(false);
      setNotice({ ok: true, text: res.message ?? "Saved." });
      if (!product && res.data) router.replace(`/products/${res.data}`);
      else router.refresh();
    });

  const remove = () => {
    if (!product || !confirm(`Delete “${product.name}” permanently? Its photos are removed too.`)) return;
    startDelete(async () => {
      const res = await deleteProductAction(product.id);
      if (res.ok) {
        setDirty(false);
        router.replace("/products");
      } else setNotice({ ok: false, text: res.error });
    });
  };

  const totalUnits = colors.reduce((n, c) => n + SIZES.reduce((m, s) => m + (stock[c.uid]?.[s] ?? 0), 0), 0);
  const pct = discountPercent(priceNum, compareNum);

  return (
    <div className="pb-24 lg:pb-0">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href="/products" className="text-sm font-semibold text-ink/55 hover:text-ink">
            ← Products
          </Link>
          <h1 className="mt-2 truncate font-display text-2xl uppercase leading-none sm:text-3xl">
            {product ? name || product.name : "New product"}
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            {dirty ? <span className="font-semibold text-amber-700">Unsaved changes</span> : product ? "All changes saved" : "Fill in the details, then save."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {product && product.status === "active" && (
            <a href={shopUrl(`/product/${product.slug}`)} target="_blank" className={abtn("outline")}>
              View in store <ExternalLink className="size-3.5" />
            </a>
          )}
          <button onClick={save} disabled={saving} className={abtn("accent", "hidden sm:inline-flex")}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save product
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={cn(
            "mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold",
            notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700",
          )}
          role={notice.ok ? "status" : "alert"}
        >
          {notice.text}
          <button onClick={() => setNotice(null)} aria-label="Dismiss">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Product name" className="sm:col-span-2">
                <input
                  value={name}
                  onChange={(e) => {
                    touch(setName)(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Shadow Monarch Tee"
                  className={input}
                />
              </Field>
              <Field label="URL slug" hint={`emrix.com.bd/product/${slug || "…"}`}>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    touch(setSlug)(slugify(e.target.value));
                  }}
                  className={cn(input, "font-mono text-xs")}
                />
              </Field>
              <Field label="Japanese name" hint="Shown under the title">
                <input value={jp} onChange={(e) => touch(setJp)(e.target.value)} placeholder="影の君主" className={cn(input, "font-jp")} />
              </Field>
              <Field label="Anime collection">
                <select value={anime} onChange={(e) => touch(setAnime)(e.target.value)} className={input}>
                  {animes.map((a) => (
                    <option key={a.slug} value={a.slug}>
                      {a.name}
                      {a.active ? "" : " (hidden)"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fit" group>
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-ink/15 bg-white p-1">
                  {(["regular", "oversized"] as Fit[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => touch(setFit)(f)}
                      className={cn("rounded-lg py-1.5 text-sm font-semibold", fit === f ? "bg-ink text-paper" : "text-ink/60 hover:bg-ink/5")}
                    >
                      {f === "regular" ? "Regular" : "Oversized"}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Description" className="sm:col-span-2" hint={`${description.length}/600`}>
                <textarea
                  value={description}
                  onChange={(e) => touch(setDescription)(e.target.value.slice(0, 600))}
                  rows={3}
                  placeholder="The story behind the print, in a sentence or two."
                  className={cn(input, "h-auto py-2.5")}
                />
              </Field>
            </div>
          </Card>

          <Card title={`Photos (${images.length})`}>
            <PhotoManager images={images} onChange={setImages} colors={preview.colors} productName={name || "Product"} />
          </Card>

          <VideoCard
            video={video}
            onChange={touch(setVideo)}
            colors={preview.colors.map((c) => c.name)}
            defaultColor={images[0]?.color}
          />

          <Card
            title="Colours & stock"
            action={<span className="text-xs text-ink/55">{totalUnits.toLocaleString("en-IN")} units in total</span>}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink/55">
                    <th className="pb-2 font-semibold">Colour</th>
                    {SIZES.map((s) => (
                      <th key={s} className="w-16 pb-2 text-center font-semibold">
                        {s}
                      </th>
                    ))}
                    <th className="w-14 pb-2 text-right font-semibold">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {colors.map((c) => (
                    <tr key={c.uid} className="border-t border-ink/[0.06]">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-ink/20" style={{ backgroundColor: c.hex }}>
                            <input
                              type="color"
                              value={c.hex}
                              onChange={(e) => {
                                setColors((cs) => cs.map((x) => (x.uid === c.uid ? { ...x, hex: e.target.value } : x)));
                                setDirty(true);
                              }}
                              className="absolute inset-0 cursor-pointer opacity-0"
                              aria-label={`${c.name || "Colour"} swatch`}
                            />
                          </label>
                          <input
                            value={c.name}
                            onChange={(e) => renameColor(c, e.target.value)}
                            placeholder="Colour name"
                            className="h-8 w-full min-w-24 rounded-lg border border-ink/15 px-2 text-sm outline-none focus:border-ink"
                          />
                        </div>
                      </td>
                      {SIZES.map((s) => {
                        const v = stock[c.uid]?.[s] ?? 0;
                        const low = Number(lowStockAt) || 0;
                        return (
                          <td key={s} className="px-1 py-2">
                            <input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={v}
                              onChange={(e) => setCell(c.uid, s, e.target.value)}
                              aria-label={`${c.name} ${s} stock`}
                              className={cn(
                                "h-8 w-full rounded-lg border px-1 text-center text-sm tabular-nums outline-none focus:border-ink",
                                v === 0 ? "border-rose-200 bg-rose-50 text-rose-700" : v <= low ? "border-amber-200 bg-amber-50 text-amber-800" : "border-ink/15",
                              )}
                            />
                          </td>
                        );
                      })}
                      <td className="py-2 text-right font-semibold tabular-nums">
                        {SIZES.reduce((n, s) => n + (stock[c.uid]?.[s] ?? 0), 0)}
                      </td>
                      <td className="py-2 pl-1 text-right">
                        <button
                          type="button"
                          disabled={colors.length === 1}
                          onClick={() => removeColor(c)}
                          className="grid size-8 place-items-center rounded-lg text-ink/40 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                          aria-label={`Remove ${c.name || "colour"}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/[0.07] pt-4">
              <span className="text-xs font-semibold text-ink/55">Add colour:</span>
              {COLOR_PRESETS.filter((p) => !colors.some((c) => c.name.toLowerCase() === p.name.toLowerCase())).map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => addColor(p)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white py-1 pl-1 pr-2.5 text-xs font-semibold hover:border-ink/40"
                >
                  <span className="size-4 rounded-full border border-ink/20" style={{ backgroundColor: p.hex }} />
                  {p.name}
                </button>
              ))}
              <button type="button" onClick={() => addColor()} className="inline-flex items-center gap-1 rounded-full border border-dashed border-ink/25 px-2.5 py-1 text-xs font-semibold hover:border-ink/50">
                <Plus className="size-3.5" /> Custom
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Set every size to" hint="Handy for a fresh restock" group>
                <div className="flex gap-2">
                  <input value={fillAll} onChange={(e) => setFillAll(e.target.value)} type="number" min={0} className={input} placeholder="e.g. 20" />
                  <button
                    type="button"
                    disabled={fillAll === ""}
                    onClick={() => {
                      const n = Math.max(0, Math.round(Number(fillAll) || 0));
                      setStock(Object.fromEntries(colors.map((c) => [c.uid, Object.fromEntries(SIZES.map((s) => [s, n]))])));
                      setDirty(true);
                    }}
                    className={abtn("outline")}
                  >
                    Apply
                  </button>
                </div>
              </Field>
              <Field label="Low-stock alert at" hint="Shows “only N left” and flags it in Inventory">
                <input value={lowStockAt} onChange={(e) => touch(setLowStockAt)(e.target.value)} type="number" min={0} className={input} />
              </Field>
            </div>
          </Card>

          <Card title="Design details" action={<span className="text-xs text-ink/55">Upload photos to change the product imagery</span>}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_200px]">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Kanji / text" hint="1–4 characters work best">
                  <input value={art.kanji} maxLength={6} onChange={(e) => touch(setArt)({ ...art, kanji: e.target.value })} className={cn(input, "font-jp text-base")} />
                </Field>
                <Field label="Subtitle">
                  <input value={art.sub} maxLength={24} onChange={(e) => touch(setArt)({ ...art, sub: e.target.value.toUpperCase() })} className={cn(input, "uppercase")} />
                </Field>
                <Field label="Print style">
                  <select value={art.motif} onChange={(e) => touch(setArt)({ ...art, motif: e.target.value as Motif })} className={input}>
                    {MOTIFS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Accent colour" group>
                  <div className="flex gap-2">
                    <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-ink/20" style={{ backgroundColor: art.accent }}>
                      <input
                        type="color"
                        value={art.accent}
                        onChange={(e) => touch(setArt)({ ...art, accent: e.target.value })}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label="Accent colour"
                      />
                    </label>
                    <input value={art.accent} onChange={(e) => touch(setArt)({ ...art, accent: e.target.value })} className={cn(input, "font-mono text-xs")} />
                  </div>
                </Field>
              </div>
              <div className="relative aspect-[5/6] overflow-hidden rounded-xl" style={{ backgroundColor: animeRecord?.tint }}>
                <span className="halftone absolute inset-0" />
                <ProductVisual product={preview} className="absolute inset-[6%]" />
              </div>
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <Card title="Status">
            <div className="space-y-2">
              {STATUS.map((s) => (
                <label
                  key={s.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5",
                    status === s.value ? "border-ink bg-paper" : "border-ink/10 hover:border-ink/30",
                  )}
                >
                  <input type="radio" name="status" checked={status === s.value} onChange={() => touch(setStatus)(s.value)} className="mt-1 accent-ink" />
                  <span>
                    <span className="block text-sm font-semibold">{s.label}</span>
                    <span className="block text-xs text-ink/55">{s.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </Card>

          <Card title="Pricing">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (৳)">
                <input value={price} onChange={(e) => touch(setPrice)(e.target.value)} type="number" min={0} inputMode="numeric" className={input} />
              </Field>
              <Field label="Compare at (৳)" hint="Optional">
                <input value={compareAt} onChange={(e) => touch(setCompareAt)(e.target.value)} type="number" min={0} inputMode="numeric" className={input} />
              </Field>
            </div>
            <p className="mt-3 text-xs text-ink/55">
              {pct ? (
                <>
                  Shows as <b className="text-shu">−{pct}%</b>, saving customers {formatBDT((compareNum ?? 0) - priceNum)}.
                </>
              ) : (
                "Add a higher compare-at price to show a discount."
              )}
            </p>
          </Card>

          <Card title="Badges">
            <div className="flex flex-wrap gap-2">
              {BADGES.map((b) => {
                const on = badges.includes(b.value);
                return (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => touch(setBadges)(on ? badges.filter((x) => x !== b.value) : [...badges, b.value])}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-semibold",
                      on ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white text-ink/60 hover:border-ink/40",
                    )}
                    aria-pressed={on}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="Preview">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-ink/10" style={{ backgroundColor: animeRecord?.tint }}>
              <span className="halftone absolute inset-0" />
              <ProductVisual product={preview} className="absolute inset-[8%]" />
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-ink/50">
              {animeRecord?.name} · {FIT_LABEL[fit]}
            </p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <p className="font-semibold">{preview.name}</p>
              <p className="text-right leading-tight">
                <span className="block font-bold">{formatBDT(priceNum)}</span>
                {pct > 0 && <s className="text-xs text-ink/40">{formatBDT(compareNum!)}</s>}
              </p>
            </div>
          </Card>

          {product && (
            <Card title="Danger zone">
              {hasOrders ? (
                <>
                  <p className="text-sm text-ink/60">This product has orders, so it can&apos;t be deleted. Archive it to hide it from the shop.</p>
                  <button
                    type="button"
                    onClick={() => touch(setStatus)("archived")}
                    disabled={status === "archived"}
                    className={abtn("outline", "mt-3 w-full")}
                  >
                    <Archive className="size-4" /> Archive (then save)
                  </button>
                </>
              ) : (
                <button type="button" onClick={remove} disabled={deleting} className={abtn("danger", "w-full")}>
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete product
                </button>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Mobile save bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <button onClick={save} disabled={saving} className={abtn("accent", "w-full")}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save product
        </button>
      </div>
    </div>
  );
}

/** Product clip: upload an MP4 (its first frame becomes the cover), tag the colour worn, replace or remove. */
function VideoCard({
  video,
  onChange,
  colors,
  defaultColor,
}: {
  video: ProductVideo | undefined;
  onChange: (v: ProductVideo | undefined) => void;
  colors: string[];
  defaultColor?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { url, poster } = await uploadVideo(file);
      onChange({ url, poster, color: video?.color ?? (defaultColor && colors.includes(defaultColor) ? defaultColor : undefined) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Video">
      {video ? (
        <div className="flex flex-col gap-4 sm:flex-row">
          <video
            key={video.url}
            src={video.url}
            poster={video.poster}
            controls
            muted
            loop
            playsInline
            preload="metadata"
            className="aspect-[9/16] w-full max-w-44 rounded-xl border border-ink/10 bg-[#dedbd5] object-contain"
          />
          <div className="flex flex-1 flex-col gap-3 text-sm">
            <p className="text-ink/60">Plays in the product page gallery, silent and looping. Save the product to apply changes.</p>
            <Field label="Colour shown">
              <select value={video.color ?? ""} onChange={(e) => onChange({ ...video, color: e.target.value || undefined })} className={input}>
                <option value="">All colours</option>
                {colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={abtn("outline")}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Replace video
              </button>
              <button
                type="button"
                onClick={() => confirm("Remove this video from the product? Save to confirm.") && onChange(undefined)}
                className={abtn("danger")}
              >
                <Trash2 className="size-4" /> Remove video
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/20 px-4 py-8 text-center text-sm font-semibold text-ink/55 transition-colors hover:border-ink/50 hover:text-ink"
        >
          {busy ? <Loader2 className="size-6 animate-spin" /> : <Film className="size-6" />}
          {busy ? "Uploading video…" : "Upload video"}
          <span className="text-xs font-normal text-ink/45">MP4, up to 20 MB. A short upright (9:16) clip works best; it plays silently on a loop.</span>
        </button>
      )}
      {error && <p className="mt-3 text-xs font-semibold text-rose-700">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="video/mp4"
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </Card>
  );
}

function Field({
  label,
  hint,
  className,
  group,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  /** Use for fields holding several controls (buttons, nested labels). */
  group?: boolean;
  children: ReactNode;
}) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className={cn("block", className)} {...(group ? { role: "group", "aria-label": label } : {})}>
      <span className="mb-1.5 block text-xs font-semibold text-ink/65">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/45">{hint}</span>}
    </Tag>
  );
}
