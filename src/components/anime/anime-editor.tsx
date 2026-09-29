"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Loader2, Save, Trash2, X } from "lucide-react";
import { SCENE_KEYS, SCENE_LABEL, sceneFor, type SceneKey } from "@emrix/shared/scenes";
import type { Anime } from "@emrix/shared/types";
import { cn, isDark, mix } from "@emrix/shared/utils";
import { SceneArt } from "@emrix/shared/ui/scene-art";
import { AnimeTile } from "@emrix/shared/ui/anime-tile";
import { deleteAnimeAction, saveAnimeAction } from "@/actions/catalog";
import { abtn, Card } from "../ui";
import { CoverUploader } from "../uploads";
import { shopUrl } from "@/lib/shop";

const input =
  "h-10 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none transition-colors placeholder:text-ink/35 focus:border-ink";
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export function AnimeEditor({ anime, productCount }: { anime: Anime | null; productCount: number }) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const [name, setName] = useState(anime?.name ?? "");
  const [slug, setSlug] = useState(anime?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!anime);
  const [jp, setJp] = useState(anime?.jp ?? "");
  const [kanji, setKanji] = useState(anime?.kanji ?? "");
  const [color, setColor] = useState(anime?.color ?? "#e5322b");
  const [blurb, setBlurb] = useState(anime?.blurb ?? "");
  const [cover, setCover] = useState<string | undefined>(anime?.cover);
  const [scene, setScene] = useState<SceneKey>(anime ? sceneFor(anime) : "hero");
  const [active, setActive] = useState(anime?.active ?? true);

  const onColor = isDark(color) ? "#ffffff" : "#111116";
  const tint = mix(color, "#ffffff", 0.84);
  const preview: Anime = {
    slug: slug || "preview",
    name: name || "New collection",
    jp,
    kanji: kanji || "新",
    color,
    onColor,
    tint,
    blurb,
    cover,
    scene,
    active,
    sort: 0,
  };

  const save = () =>
    startSave(async () => {
      setNotice(null);
      const res = await saveAnimeAction(anime?.slug ?? null, {
        slug,
        name: name.trim(),
        jp: jp.trim(),
        kanji: kanji.trim(),
        color,
        onColor,
        tint,
        blurb: blurb.trim(),
        cover,
        scene,
        active,
      });
      if (!res.ok) return setNotice({ ok: false, text: res.error });
      setNotice({ ok: true, text: res.message ?? "Saved." });
      if (!anime || res.data !== anime.slug) router.replace(`/anime/${res.data}`);
      else router.refresh();
    });

  const remove = () => {
    if (!anime || !confirm(`Delete the ${anime.name} collection?`)) return;
    startDelete(async () => {
      const res = await deleteAnimeAction(anime.slug);
      if (res.ok) router.replace("/anime");
      else setNotice({ ok: false, text: res.error });
    });
  };

  return (
    <div className="pb-24 lg:pb-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/anime" className="text-sm font-semibold text-ink/55 hover:text-ink">
            ← Anime collections
          </Link>
          <h1 className="mt-2 font-display text-2xl uppercase leading-none sm:text-3xl">{anime ? name || anime.name : "New collection"}</h1>
        </div>
        <button onClick={save} disabled={saving} className={abtn("accent", "hidden sm:inline-flex")}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save collection
        </button>
      </div>

      {notice && (
        <div className={cn("mb-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold", notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700")}>
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
              <Field label="Anime name">
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Blue Lock"
                  className={input}
                />
              </Field>
              <Field label="URL slug" hint={`/anime/${slug || "…"}`}>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  className={cn(input, "font-mono text-xs")}
                />
              </Field>
              <Field label="Japanese name">
                <input value={jp} onChange={(e) => setJp(e.target.value)} placeholder="ブルーロック" className={cn(input, "font-jp")} />
              </Field>
              <Field label="Kanji mark" hint="1–2 characters, used as the collection's emblem">
                <input value={kanji} maxLength={2} onChange={(e) => setKanji(e.target.value)} placeholder="蹴" className={cn(input, "font-jp text-base")} />
              </Field>
              <Field label="Tagline" className="sm:col-span-2" hint={`${blurb.length}/160`}>
                <input value={blurb} maxLength={160} onChange={(e) => setBlurb(e.target.value)} placeholder="One line that sells the vibe." className={input} />
              </Field>
            </div>
          </Card>

          <Card title="Look">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[180px_1fr]">
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-ink/65">Collection colour</span>
                <div className="flex items-center gap-2">
                  <label className="relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-ink/20" style={{ backgroundColor: color }}>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Collection colour" />
                  </label>
                  <input value={color} onChange={(e) => setColor(e.target.value)} className={cn(input, "font-mono text-xs")} aria-label="Colour hex" />
                </div>
                <p className="mt-2 flex items-center gap-2 text-xs text-ink/50">
                  Card tint <span className="size-4 rounded border border-ink/15" style={{ backgroundColor: tint }} />
                </p>
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-ink/65">Illustration</span>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {SCENE_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setScene(k)}
                      title={SCENE_LABEL[k]}
                      aria-label={SCENE_LABEL[k]}
                      aria-pressed={scene === k}
                      className={cn(
                        "relative aspect-[4/5] overflow-hidden rounded-lg border-2 transition-all",
                        scene === k ? "border-ink shadow-panel-sm" : "border-transparent opacity-75 hover:opacity-100",
                      )}
                    >
                      <SceneArt scene={k} color={color} className="absolute inset-0 size-full" />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink/55">
                  {SCENE_LABEL[scene]} · bundled anime artwork, used when there&apos;s no cover image.
                </p>
              </div>
            </div>
            <div className="mt-5 border-t border-ink/[0.07] pt-5">
              <span className="mb-1.5 block text-xs font-semibold text-ink/65">Cover image (optional)</span>
              <CoverUploader value={cover} onChange={setCover} />
              <p className="mt-2 text-xs text-ink/50">Only upload artwork you own or have a licence to use. Leave empty to use the illustration.</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Visibility">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold">{active ? "Visible in shop" : "Hidden"}</span>
                <span className="block text-xs text-ink/55">Hidden collections also hide their products.</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => setActive(!active)}
                className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", active ? "bg-emerald-600" : "bg-ink/20")}
              >
                <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", active ? "left-[22px]" : "left-0.5")} />
              </button>
            </label>
          </Card>

          <Card title="Preview">
            <div className="pointer-events-none">
              <AnimeTile anime={preview} index={1} count={productCount} href={shopUrl(`/anime/${preview.slug}`)} />
            </div>
          </Card>

          {anime && (
            <Card title="Danger zone">
              {productCount > 0 ? (
                <p className="text-sm text-ink/60">
                  This collection has {productCount} product{productCount === 1 ? "" : "s"}. Move them to another collection (or hide this one) before deleting.
                </p>
              ) : (
                <button type="button" onClick={remove} disabled={deleting} className={abtn("danger", "w-full")}>
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete collection
                </button>
              )}
            </Card>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <button onClick={save} disabled={saving} className={abtn("accent", "w-full")}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save collection
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold text-ink/65">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/45">{hint}</span>}
    </label>
  );
}
