import type { Metadata } from "next";
import { can } from "@emrix/shared/admin";
import { NoAccess } from "@/components/no-access";
import { ProductEditor } from "@/components/products/product-editor";
import { requireAdmin } from "@/lib/auth";
import { getAllAnimes } from "@/lib/backend";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const admin = await requireAdmin();
  if (!can(admin.role, "products:edit")) return <NoAccess what="add products" />;
  return <ProductEditor product={null} animes={await getAllAnimes()} hasOrders={false} />;
}
