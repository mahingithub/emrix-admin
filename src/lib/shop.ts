// Links from the admin panel to the storefront (a separate site, e.g. https://emrix.com).
const SHOP_URL = (process.env.NEXT_PUBLIC_SHOP_URL ?? "").trim().replace(/\/+$/, "") || "http://localhost:3100";

/** Full storefront address for a shop path, e.g. shopUrl(`/product/${slug}`). */
export const shopUrl = (path = "/") => `${SHOP_URL}${path}`;
