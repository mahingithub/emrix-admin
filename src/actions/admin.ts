"use server";

import { redirect } from "next/navigation";
import type { AdminSession } from "@emrix/shared/api";
import type { OrderStatus } from "@emrix/shared/orders";
import { endSession, startSession } from "@/lib/auth";
import { backend, BackendError, send } from "@/lib/backend";
import { runAction, type ActionResult } from "./run";

export type { ActionResult };

function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/";
}

const order = (code: string) => `/admin/orders/${encodeURIComponent(code)}`;

/* --- Auth ----------------------------------------------------------- */

export type LoginState = { error?: string; email?: string };

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  let session: AdminSession;
  try {
    session = await backend<AdminSession>("/admin/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  } catch (e) {
    if (e instanceof BackendError && e.code === "setup_required") redirect("/setup");
    return { error: e instanceof Error ? e.message : "Couldn't sign in. Please try again.", email };
  }
  await startSession(session);
  redirect(safeNext(form.get("next")));
}

export async function logoutAction() {
  await endSession();
  redirect("/login");
}

/* --- Orders --------------------------------------------------------- */

export async function updateOrderStatusAction(code: string, to: OrderStatus, reason?: string) {
  return runAction(() => send("POST", `${order(code)}/status`, { to, reason }));
}

export async function bulkStatusAction(codes: string[], to: OrderStatus) {
  return runAction(
    async () => {
      const { updated, skipped } = await send<{ updated: number; skipped: string[] }>("POST", "/admin/orders/bulk-status", { codes, to });
      return `${updated} order${updated === 1 ? "" : "s"} updated${skipped.length ? `, ${skipped.length} skipped (not eligible)` : ""}.`;
    },
    (text) => text,
  );
}

export async function verifyPaymentAction(code: string, approve: boolean) {
  return runAction(() => send("POST", `${order(code)}/payment`, { approve }));
}

export async function setCourierAction(code: string, courier: string, trackingNo: string) {
  return runAction(() => send("POST", `${order(code)}/courier`, { courier, trackingNo }));
}

export async function addNoteAction(code: string, text: string) {
  return runAction(() => send("POST", `${order(code)}/notes`, { text }));
}
