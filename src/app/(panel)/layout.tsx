import type { ReactNode } from "react";
import { AdminShell } from "@/components/shell";
import { requireAdmin } from "@/lib/auth";
import { countOrders } from "@/lib/backend";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const newOrders = await countOrders("placed");
  return (
    <AdminShell admin={admin} newOrders={newOrders}>
      {children}
    </AdminShell>
  );
}
