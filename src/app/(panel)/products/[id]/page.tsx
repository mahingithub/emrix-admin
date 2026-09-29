import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { can } from "@emrix/shared/admin";
import { NoAccess } from "@/components/no-access";
import { ProductEditor } from "@/components/products/product-editor";
import { requireAdmin } from "@/lib/auth";
import { findProduct, getAllAnimes } from "@/lib/backend";

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const found = await findProduct(id);
  return { title: found ? found.product.name : "Product" };
}

export default async function EditProductPage({ params }: PageProps<"/products/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const found = await findProduct(id);
  if (!found) notFound();
  const { product, hasOrders } = found;
  if (!can(admin.role, "products:edit")) return <NoAccess what="edit products (stock counts are in Inventory)" />;
  return <ProductEditor product={product} animes={await getAllAnimes()} hasOrders={hasOrders} />;
}
