import type { Metadata } from "next";
import { can } from "@emrix/shared/admin";
import { toDhakaInput } from "@emrix/shared/time";
import { PageHeader } from "@/components/ui";
import { NoAccess } from "@/components/no-access";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireAdmin } from "@/lib/auth";
import { getAllProducts, getSettings } from "@/lib/backend";

export const metadata: Metadata = { title: "Settings" };

/** A week from now at 9 PM Dhaka time: a sensible starting point for a new drop. */
const defaultDropEnd = () => toDhakaInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()).slice(0, 11) + "21:00";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  if (!can(admin.role, "settings:edit")) return <NoAccess what="change store settings" owner />;
  const [settings, products] = await Promise.all([getSettings(), getAllProducts()]);
  const options = products
    .filter((p) => p.status !== "archived")
    .map((p) => ({ slug: p.slug, name: p.name, status: p.status, sold: p.sold }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <PageHeader jp="設定" title="Settings" description="Store details customers see, how they pay, and delivery charges." />
      <SettingsForm settings={settings} products={options} dropEndsLocal={settings.drop ? toDhakaInput(settings.drop.endsAt) : defaultDropEnd()} />
    </>
  );
}
