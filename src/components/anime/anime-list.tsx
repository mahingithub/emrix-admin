"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil } from "lucide-react";
import { sceneFor } from "@emrix/shared/scenes";
import type { Anime } from "@emrix/shared/types";
import { cn } from "@emrix/shared/utils";
import { SceneArt } from "@emrix/shared/ui/scene-art";
import { reorderAnimesAction, saveAnimeAction } from "@/actions/catalog";

export function AnimeList({ animes, counts, canEdit }: { animes: Anime[]; counts: Record<string, number>; canEdit: boolean }) {
  const router = useRouter();
  const [order, setOrder] = useState(animes.map((a) => a.slug));
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const bySlug = new Map(animes.map((a) => [a.slug, a]));
  const list = order.map((s) => bySlug.get(s)).filter((a): a is Anime => !!a);

  const move = (i: number, dir: -1 | 1) => {
    const next = order.slice();
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setOrder(next);
    start(async () => {
      const res = await reorderAnimesAction(next);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  };

  const toggle = (a: Anime) =>
    start(async () => {
      const { slug, name, jp, kanji, color, onColor, tint, blurb, cover, scene } = a;
      const res = await saveAnimeAction(a.slug, { slug, name, jp, kanji, color, onColor, tint, blurb, cover, scene, active: !a.active });
      if (!res.ok) setError(res.error);
      router.refresh();
    });

  return (
    <div>
      {error && <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((a, i) => (
          <li key={a.slug} className={cn("flex gap-3 rounded-2xl border border-ink/10 bg-white p-3", !a.active && "opacity-60")}>
            <span className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: a.color }}>
              {a.cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- uploaded covers are pre-sized in the browser
                <img src={a.cover} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <SceneArt scene={sceneFor(a)} color={a.color} className="absolute inset-0 size-full" />
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.name}</p>
                  <p className="truncate font-jp text-xs text-ink/50">{a.jp}</p>
                </div>
                <span className="shrink-0 font-display text-xs text-ink/35">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <p className="mt-1 text-xs text-ink/55">
                {counts[a.slug] ?? 0} product{counts[a.slug] === 1 ? "" : "s"} · {a.active ? "Visible" : "Hidden"}
                {a.cover ? " · custom cover" : ""}
              </p>
              {canEdit && (
                <div className="mt-auto flex items-center gap-1 pt-2">
                  <IconBtn label="Move up" disabled={i === 0 || pending} onClick={() => move(i, -1)}>
                    <ArrowUp className="size-4" />
                  </IconBtn>
                  <IconBtn label="Move down" disabled={i === list.length - 1 || pending} onClick={() => move(i, 1)}>
                    <ArrowDown className="size-4" />
                  </IconBtn>
                  <IconBtn label={a.active ? "Hide from shop" : "Show in shop"} disabled={pending} onClick={() => toggle(a)}>
                    {a.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </IconBtn>
                  <Link
                    href={`/anime/${a.slug}`}
                    className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold hover:border-ink/40"
                  >
                    <Pencil className="size-3.5" /> Edit
                  </Link>
                  {pending && <Loader2 className="size-4 animate-spin text-ink/40" />}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-8 place-items-center rounded-lg border border-ink/10 hover:border-ink/40 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
