"use server";

import type { StarterGap } from "@emrix/shared/api";
import type { AnimeFormInput, PhotoAssignment, ProductFormInput } from "@emrix/shared/schemas";
import type { Size } from "@emrix/shared/types";
import { send } from "@/lib/backend";
import { runAction as run } from "./run";

const product = (id: string) => `/admin/products/${encodeURIComponent(id)}`;
const anime = (slug: string) => `/admin/animes/${encodeURIComponent(slug)}`;

export async function saveProductAction(id: string | null, input: ProductFormInput) {
  return run(
    async () => (await send<{ id: string }>(id ? "PUT" : "POST", id ? product(id) : "/admin/products", input)).id,
    id ? "Product saved." : "Product created.",
  );
}

export async function setProductStatusAction(id: string, status: "active" | "draft" | "archived") {
  return run(() => send("POST", `${product(id)}/status`, { status }));
}

export async function deleteProductAction(id: string) {
  return run(() => send("DELETE", product(id)), "Product deleted.");
}

/** Bulk photo upload: append already-uploaded photos to products. */
export async function attachPhotosAction(assignments: PhotoAssignment[]) {
  return run(async () => (await send<{ count: number }>("POST", "/admin/products/photos", assignments)).count);
}

export async function setStockAction(productId: string, color: string, size: Size, value: number, reason: "restock" | "damaged" | "correction") {
  return run(async () => (await send<{ value: number }>("POST", "/admin/stock", { productId, color, size, value, reason })).value);
}

/* --- Anime collections ---------------------------------------------- */

export async function saveAnimeAction(originalSlug: string | null, input: AnimeFormInput) {
  return run(
    async () => (await send<{ slug: string }>(originalSlug ? "PUT" : "POST", originalSlug ? anime(originalSlug) : "/admin/animes", input)).slug,
    originalSlug ? "Collection saved." : "Collection created.",
  );
}

export async function reorderAnimesAction(slugs: string[]) {
  return run(() => send("POST", "/admin/animes/reorder", { slugs }));
}

/** One-time import of the launch collections and designs (as drafts, no stock). */
export async function importStarterCatalogAction() {
  return run(
    () => send<StarterGap>("POST", "/admin/products/import-starter"),
    (r) =>
      r.products || r.animes
        ? `Imported ${r.animes} collections and ${r.products} products as drafts. Add stock, then publish.`
        : "Everything from the starter catalogue is already here.",
  );
}

export async function publishReadyDraftsAction() {
  return run(
    async () => (await send<{ count: number }>("POST", "/admin/products/publish-ready")).count,
    (n) => (n ? `${n} product${n === 1 ? " is" : "s are"} now live in the shop.` : "No drafts have stock yet. Add stock in Inventory first."),
  );
}

export async function deleteAnimeAction(slugToDelete: string) {
  return run(() => send("DELETE", anime(slugToDelete)), "Collection deleted.");
}
