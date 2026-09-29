import type { Metadata } from "next";
import { can } from "@emrix/shared/admin";
import { NoAccess } from "@/components/no-access";
import { AnimeEditor } from "@/components/anime/anime-editor";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New collection" };

export default async function NewAnimePage() {
  const admin = await requireAdmin();
  if (!can(admin.role, "products:edit")) return <NoAccess what="add collections" />;
  return <AnimeEditor anime={null} productCount={0} />;
}
