import type { NextConfig } from "next";

// Addresses of the backend and the storefront. Needed at build time too (rewrites are baked in).
const api = (process.env.API_URL ?? "").trim().replace(/\/+$/, "");
const shop = (process.env.NEXT_PUBLIC_SHOP_URL ?? "").trim().replace(/\/+$/, "") || "http://localhost:3100";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Uploaded photos and videos live in the backend (MongoDB).
      ...(api ? [{ source: "/media/:name", destination: `${api}/media/:name` }] : []),
      // The launch mockups and collection art ship with the storefront.
      { source: "/images/:path*", destination: `${shop}/images/:path*` },
    ];
  },
};

export default nextConfig;
