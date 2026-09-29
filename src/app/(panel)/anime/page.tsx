import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { can } from "@emrix/shared/admin";
import { abtn, PageHeader } from "@/components/ui";
import { AnimeList } from "@/components/anime/anime-list";
import { requireAdmin } from "@/lib/auth";
import { getAllAnimes, productCounts } from "@/lib/backend";

export const metadata: Metadata = { title: "Anime collections" };

export default async function AnimeAdminPage() {
  const admin = await requireAdmin();
  const [animes, allCounts] = await Promise.all([getAllAnimes(), productCounts()]);
  const counts = Object.fromEntries(animes.map((a) => [a.slug, allCounts[a.slug] ?? 0]));
  const canEdit = can(admin.role, "products:edit");
  return (
    <>
      <PageHeader
        jp="作品"
        title="Anime collections"
        description="Order sets how collections appear across the shop. Each one has its own colour and illustration."
        actions={
          canEdit && (
            <Link href="/anime/new" className={abtn("accent")}>
              <Plus className="size-4" /> New collection
            </Link>
          )
        }
      />
      <AnimeList animes={animes} counts={counts} canEdit={canEdit} />
    </>
  );
}
