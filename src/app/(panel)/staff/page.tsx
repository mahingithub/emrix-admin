import type { Metadata } from "next";
import { can } from "@emrix/shared/admin";
import { PageHeader } from "@/components/ui";
import { NoAccess } from "@/components/no-access";
import { StaffManager } from "@/components/staff/staff-manager";
import { listAdmins } from "@/lib/backend";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const admin = await requireAdmin();
  if (!can(admin.role, "staff:manage")) return <NoAccess what="manage staff accounts" owner />;
  const rows = await listAdmins();
  const active = rows.filter((r) => r.active).length;
  return (
    <>
      <PageHeader jp="スタッフ" title="Staff" description={`${active} active account${active === 1 ? "" : "s"}. Everyone signs in with their own email, so the activity log shows who did what.`} />
      <StaffManager rows={rows} meId={admin.id} />
    </>
  );
}
