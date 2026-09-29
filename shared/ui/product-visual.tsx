import Image from "next/image";
import { productPhotos } from "../src/catalog-media";
import type { Product, ProductImage, TeeColor } from "../src/types";
import { cn } from "../src/utils";

export { productPhotos };

export type TeeView = "front" | "back" | "detail";

const VIEW_INDEX: Record<TeeView, number> = { front: 0, back: 1, detail: 2 };

export function ProductPhoto({ photo, className, eager, sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px" }: {
  photo: ProductImage;
  className?: string;
  eager?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src={photo.url}
      alt={photo.alt}
      fill
      sizes={sizes}
      // Bundled and uploaded (/media) photos are resized for each screen; only external URLs skip it.
      unoptimized={!photo.url.startsWith("/")}
      loading={eager ? "eager" : "lazy"}
      className={cn("object-contain bg-[#dedbd5]", className)}
    />
  );
}

/** Only show views that exist; never invent a garment back or another colour. */
export function ProductVisual({ product, color, view = "front", className, photoClassName, eager }: {
  product: Product;
  color?: TeeColor;
  view?: TeeView;
  className?: string;
  photoClassName?: string;
  eager?: boolean;
}) {
  const photo = productPhotos(product, color?.name)[VIEW_INDEX[view]];
  if (photo) return <ProductPhoto photo={photo} className={photoClassName} eager={eager} />;
  if (view !== "front") return null;
  return (
    <span className={cn("absolute inset-0 grid place-items-center p-4 text-center text-xs font-semibold text-ink/50", className)}>
      Product photography coming soon
    </span>
  );
}
