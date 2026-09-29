"use server";

import { redirect } from "next/navigation";
import type { AdminSession } from "@emrix/shared/api";
import { startSession } from "@/lib/auth";
import { backend } from "@/lib/backend";

export type SetupState = { error?: string; values?: { name?: string; email?: string } };

const fields = (form: FormData) => ({
  key: String(form.get("key") ?? ""),
  name: String(form.get("name") ?? ""),
  email: String(form.get("email") ?? ""),
  password: String(form.get("password") ?? ""),
  confirm: String(form.get("confirm") ?? ""),
});

/** Creates the first owner with ADMIN_SETUP_KEY (checked by the backend) and signs them in. */
export async function setupOwnerAction(_prev: SetupState, form: FormData): Promise<SetupState> {
  const input = fields(form);
  const values = { name: input.name, email: input.email };
  try {
    await startSession(await backend<AdminSession>("/admin/setup/owner", { method: "POST", body: JSON.stringify(input) }));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Setup failed. Please try again.", values };
  }
  redirect("/?welcome=1");
}

/** Setup-key recovery: a new password for an existing owner. */
export async function recoverOwnerAction(_prev: SetupState, form: FormData): Promise<SetupState> {
  const input = fields(form);
  const values = { email: input.email };
  try {
    await startSession(await backend<AdminSession>("/admin/setup/recover", { method: "POST", body: JSON.stringify(input) }));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Recovery failed. Please try again.", values };
  }
  redirect("/");
}
