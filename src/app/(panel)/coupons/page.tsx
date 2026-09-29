import type { Metadata } from "next";
import { can } from "@emrix/shared/admin";
import { fmtDateTime, toDhakaInput } from "@emrix/shared/time";
import { PageHeader } from "@/components/ui";
import { NoAccess } from "@/components/no-access";
import { CouponManager, type CouponRow } from "@/components/coupons/coupon-manager";
import { requireAdmin } from "@/lib/auth";
import { listCoupons } from "@/lib/backend";

export const metadata: Metadata = { title: "Coupons" };

const isPast = (iso?: string) => !!iso && Date.parse(iso) < Date.now();

export default async function CouponsPage() {
  const admin = await requireAdmin();
  if (!can(admin.role, "coupons:edit")) return <NoAccess what="manage coupons" />;
  const rows: CouponRow[] = (await listCoupons()).map((c) => ({
    code: c.code,
    type: c.type,
    value: c.value,
    label: c.label,
    minOrder: c.minOrder,
    maxUses: c.maxUses,
    used: c.used,
    expires: c.expiresAt ? fmtDateTime(c.expiresAt) : undefined,
    expiresLocal: toDhakaInput(c.expiresAt),
    expired: isPast(c.expiresAt),
    active: c.active,
  }));
  return (
    <>
      <PageHeader jp="クーポン" title="Coupons" description="Discount codes customers enter at checkout. Used codes can be turned off but not deleted, so old orders stay accurate." />
      <CouponManager rows={rows} />
    </>
  );
}
