"use client";
/* eslint-disable @next/next/no-img-element -- local previews of files being uploaded */

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Sparkles, UploadCloud, XCircle } from "lucide-react";
import type { ProductImage, TeeColor } from "@emrix/shared/types";
import { cn } from "@emrix/shared/utils";
import { attachPhotosAction } from "@/actions/catalog";
import { Dialog } from "../dialog";
import { abtn } from "../ui";
import { uploadImage } from "../uploads";

export interface MatchableProduct {
  id: string;
  name: string;
  slug: string;
  colors: TeeColor[];
}

interface Row {
  id: string;
  file: File;
  preview: string;
  productId: string;
  color: string;
  state: "ready" | "uploading" | "done" | "error";
  error?: string;
}

const GENERIC = new Set(["tee", "t", "shirt", "tshirt", "the", "emrix", "photo", "img", "image", "front", "back", "final", "copy"]);
const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Best product + colour for a filename like "shadow-monarch-tee_black_front-2.jpg". */
export function matchFile(fileName: string, products: MatchableProduct[]) {
  const words = tokens(fileName);
  const joined = words.join("-");
  let best: { product: MatchableProduct; score: number } | null = null;
  for (const p of products) {
    const key = tokens(p.slug).filter((t) => !GENERIC.has(t));
    if (!key.length) continue;
    const hits = key.filter((t) => words.includes(t)).length;
    let score = hits / key.length;
    if (joined.includes(p.slug)) score += 1;
    if (!best || score > best.score) best = { product: p, score };
  }
  const product = best && best.score >= 0.6 ? best.product : undefined;
  const color = product?.colors.find((c) => words.includes(c.name.toLowerCase()))?.name ?? "";
  return { productId: product?.id ?? "", color };
}

const natural = (a: string, b: string) => {
  const rank = (n: string) => (/back/i.test(n) ? 1 : /detail|close/i.test(n) ? 2 : 0);
  return a.localeCompare(b, undefined, { numeric: true }) + (rank(a) - rank(b)) * 1000;
};

export function BulkPhotoUpload({ products }: { products: MatchableProduct[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState("");
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    setRows((rs) => {
      rs.forEach((r) => URL.revokeObjectURL(r.preview));
      return [];
    });
    setSummary("");
  }, [busy]);

  const addFiles = (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/")).sort((a, b) => natural(a.name, b.name));
    setRows((prev) => [
      ...prev,
      ...images.map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        preview: URL.createObjectURL(file),
        ...matchFile(file.name, products),
        state: "ready" as const,
      })),
    ]);
    setSummary("");
  };

  const update = (id: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const matched = rows.filter((r) => r.productId && r.state !== "done");

  const start = async () => {
    setBusy(true);
    const byProduct = new Map<string, ProductImage[]>();
    for (const row of matched) {
      update(row.id, { state: "uploading" });
      try {
        const url = await uploadImage(row.file);
        const product = products.find((p) => p.id === row.productId)!;
        const list = byProduct.get(row.productId) ?? [];
        list.push({
          id: Math.random().toString(36).slice(2, 10),
          url,
          alt: `${product.name}${row.color ? ` in ${row.color}` : ""}`,
          color: row.color || undefined,
        });
        byProduct.set(row.productId, list);
        update(row.id, { state: "done" });
      } catch (e) {
        update(row.id, { state: "error", error: e instanceof Error ? e.message : "Upload failed" });
      }
    }
    const res = await attachPhotosAction([...byProduct.entries()].map(([productId, images]) => ({ productId, images })));
    setBusy(false);
    setSummary(
      res.ok ? `Attached ${res.data ?? 0} photo${res.data === 1 ? "" : "s"} to ${byProduct.size} product${byProduct.size === 1 ? "" : "s"}.` : res.error,
    );
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={abtn("outline")}>
        <UploadCloud className="size-4" /> Bulk upload photos
      </button>
      <Dialog
        open={open}
        onClose={close}
        size="lg"
        title="Bulk upload photos"
        description="Drop a batch of photos. Each file is matched to a product and colour from its name, so you only fix what's unmatched."
      >
        <div>
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              addFiles([...e.dataTransfer.files]);
            }}
            className={cn(
              "flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-sm font-semibold transition-colors",
              over ? "border-shu bg-shu/5 text-shu" : "border-ink/20 text-ink/60 hover:border-ink/50",
            )}
          >
            <ImagePlus className="size-6" />
            Choose photos or drop them here
            <span className="text-xs font-normal text-ink/45">
              Tip: name files like <code className="font-mono">shadow-monarch-tee-black-1.jpg</code>
            </span>
          </button>
          <input
            ref={input}
            type="file"
            multiple
            hidden
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => {
              if (e.target.files) addFiles([...e.target.files]);
              e.target.value = "";
            }}
          />

          {rows.length > 0 && (
            <>
              <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-ink/60">
                <Sparkles className="size-3.5 text-shu" /> Auto-matched {rows.filter((r) => r.productId).length} of {rows.length}
              </p>
              <ul className="mt-2 max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                {rows.map((r) => {
                  const product = products.find((p) => p.id === r.productId);
                  return (
                    <li key={r.id} className="flex items-center gap-3 rounded-xl border border-ink/10 p-2">
                      <img src={r.preview} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="truncate text-xs text-ink/55">{r.file.name}</p>
                        <div className="flex gap-1.5">
                          <select
                            value={r.productId}
                            disabled={r.state !== "ready"}
                            onChange={(e) => update(r.id, { productId: e.target.value, color: "" })}
                            className={cn("h-8 min-w-0 flex-1 rounded-lg border px-2 text-xs", r.productId ? "border-ink/15" : "border-amber-300 bg-amber-50")}
                            aria-label="Product"
                          >
                            <option value="">Skip (no match)</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={r.color}
                            disabled={!product || r.state !== "ready"}
                            onChange={(e) => update(r.id, { color: e.target.value })}
                            className="h-8 w-28 rounded-lg border border-ink/15 px-2 text-xs"
                            aria-label="Colour"
                          >
                            <option value="">All colours</option>
                            {product?.colors.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <span className="w-5 shrink-0">
                        {r.state === "uploading" && <Loader2 className="size-5 animate-spin" />}
                        {r.state === "done" && <CheckCircle2 className="size-5 text-emerald-600" />}
                        {r.state === "error" && (
                          <span title={r.error}>
                            <XCircle className="size-5 text-rose-600" />
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {summary && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{summary}</p>}

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={close} disabled={busy} className={abtn("outline", "flex-1")}>
              {summary ? "Done" : "Cancel"}
            </button>
            <button type="button" onClick={start} disabled={busy || matched.length === 0} className={abtn("accent", "flex-1")}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              Upload {matched.length || ""} photo{matched.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
