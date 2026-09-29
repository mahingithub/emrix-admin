import type { SceneKey } from "./scenes";

export type Size = "S" | "M" | "L" | "XL" | "XXL";
export type Fit = "regular" | "oversized";
export type Badge = "new" | "bestseller" | "limited";

/** Print design metadata maintained in the catalogue editor. */
export type Motif =
  | "hinomaru"
  | "burst"
  | "slash"
  | "spiral"
  | "box"
  | "vertical"
  | "checker"
  | "wave";

export interface TeeColor {
  name: string;
  hex: string;
}

export interface Anime {
  slug: string;
  name: string;
  jp: string;
  kanji: string;
  color: string;
  onColor: string;
  tint: string;
  blurb: string;
  /** Optional banner/tile image (uploaded in admin). */
  cover?: string;
  /** Built-in illustration shown when there's no cover image. */
  scene?: SceneKey;
  active: boolean;
  sort: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  /** Colour name this photo shows; unset = all colours. */
  color?: string;
  /** A photo of the tee's back print (flat). Photo try-on uses it to show the shopper from behind. */
  back?: boolean;
}

/** Short product clip (MP4), shown in the product page gallery. */
export interface ProductVideo {
  url: string;
  /** Still shown before the clip loads. */
  poster?: string;
  /** Colour worn in the clip; unset = all colours. */
  color?: string;
}

export type ProductStatus = "active" | "draft" | "archived";

/** colour name -> size -> units in stock */
export type StockMap = Record<string, Partial<Record<Size, number>>>;

export interface Product {
  id: string;
  slug: string;
  name: string;
  jp: string;
  anime: string;
  fit: Fit;
  price: number;
  compareAt?: number;
  colors: TeeColor[];
  badges: Badge[];
  rating: number;
  reviews: number;
  sold: number;
  createdAt: string;
  updatedAt?: string;
  description: string;
  status: ProductStatus;
  images: ProductImage[];
  video?: ProductVideo;
  stock: StockMap;
  /** Show "only N left" / low-stock alerts at or below this. */
  lowStockAt: number;
  art: {
    kanji: string;
    sub: string;
    motif: Motif;
    accent: string;
  };
}
