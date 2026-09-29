import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { can } from "@emrix/shared/admin";
import { NoAccess } from "@/components/no-access";
import { AnimeEditor } from "@/components/anime/anime-editor";
import { requireAdmin } from "@/lib/auth";
import { findAnime, productCounts } from "@/lib/backend";

export async function generateMetadata({ params }: PageProps<"/anime/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: (await findAnime(slug))?.name ?? "Collection" };
}

export default async function EditAnimePage({ params }: PageProps<"/anime/[slug]">) {
  const admin = await requireAdmin();
  const { slug } = await params;
  const anime = await findAnime(slug);
  if (!anime) notFound();
  if (!can(admin.role, "products:edit")) return <NoAccess what="edit collections" />;
  const counts = await productCounts();
  return <AnimeEditor key={anime.slug} anime={anime} productCount={counts[slug] ?? 0} />;
}
