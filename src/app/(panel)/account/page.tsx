import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { ROLE_HINT, ROLE_LABEL } from "@emrix/shared/admin";
import { abtn, PageHeader } from "@/components/ui";
import { AccountForms } from "@/components/staff/account-forms";
import { logoutAction } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  return (
    <>
      <PageHeader
        jp="アカウント"
        title="Your account"
        description={
          <>
            {admin.email} · {ROLE_LABEL[admin.role]}: {ROLE_HINT[admin.role].toLowerCase()}
          </>
        }
        actions={
          <form action={logoutAction}>
            <button className={abtn("outline")}>
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        }
      />
      <AccountForms name={admin.name} />
    </>
  );
}
