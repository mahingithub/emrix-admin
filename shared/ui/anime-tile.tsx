import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { sceneFor } from "../src/scenes";
import type { Anime } from "../src/types";
import { SceneArt } from "./scene-art";

/**
 * Collection tile: uploaded cover if there is one, otherwise the built-in illustration. Links to the
 * collection in the shop; the admin panel passes the shop's full address as `href`.
 */
export function AnimeTile({ anime, index, count, href = `/anime/${anime.slug}` }: { anime: Anime; index: number; count: number; href?: string }) {
  return (
    <Link
      href={href}
      className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl border-2 border-ink p-4 text-white shadow-panel-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-panel sm:p-5"
      style={{ backgroundColor: anime.color }}
    >
      {anime.cover ? (
        // Same framing as the built-in art, and resized for phones by next/image.
        <Image
          src={anime.cover}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 480px"
          className="object-cover object-[center_35%] transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <SceneArt
          scene={sceneFor(anime)}
          color={anime.color}
          className="absolute inset-0 size-full transition-transform duration-500 group-hover:scale-105"
          title={`${anime.name} illustration`}
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/25" />

      <div className="relative flex items-start justify-between gap-2 [text-shadow:0_1px_6px_rgb(0_0_0/0.5)]">
        <span className="font-display text-sm opacity-90">{String(index).padStart(2, "0")}</span>
        <span className="writing-vertical font-jp text-[10px] font-bold tracking-[0.2em] opacity-90">{anime.jp}</span>
      </div>

      <div className="relative">
        <h3 className="font-display text-lg uppercase leading-[0.95] sm:text-2xl">{anime.name}</h3>
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
          {count} design{count === 1 ? "" : "s"}
          <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
}
