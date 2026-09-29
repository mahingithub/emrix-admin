import Image from "next/image";
import { COLLECTION_ART } from "../src/catalog-media";
import type { SceneKey } from "../src/scenes";
import { cn } from "../src/utils";

/** Detailed, locally hosted collection art shared by the storefront and admin. */
export function SceneArt({ scene, className, title, eager = false }: {
  scene: SceneKey;
  color?: string;
  kanji?: string;
  className?: string;
  title?: string;
  eager?: boolean;
}) {
  const artwork = COLLECTION_ART[scene];
  return (
    <span className={cn("block overflow-hidden", className)}>
      <Image
        src={artwork.src}
        alt={title ?? artwork.alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 480px"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className="object-cover object-[center_35%]"
      />
    </span>
  );
}
