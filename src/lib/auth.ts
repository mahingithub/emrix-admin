// The signed-in admin. Sessions live in the backend; this app keeps the session token in an
// httpOnly cookie and asks the backend who it belongs to (once per request).
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { AdminUser } from "@emrix/shared/admin";
import type { AdminSession } from "@emrix/shared/api";
import { backend, BackendError, SESSION_COOKIE } from "./backend";

/** Current admin for this request, or null. */
export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => {
  if (!(await cookies()).get(SESSION_COOKIE)?.value) return null;
  try {
    return await backend<AdminUser>("/admin/auth/me");
  } catch (e) {
    if (e instanceof BackendError && e.status === 401) return null;
    throw e;
  }
});

/** For pages: redirects to login when signed out. */
export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  return admin;
}

/** Keeps a new session (after sign-in, setup or recovery) in this browser. */
export async function startSession(session: AdminSession) {
  (await cookies()).set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
}

export async function endSession() {
  const jar = await cookies();
  if (jar.get(SESSION_COOKIE)) {
    await backend("/admin/auth/logout", { method: "POST" }).catch(() => undefined);
    jar.delete(SESSION_COOKIE);
  }
}
