// Shared wrapper for the admin panel's server actions (a plain module, so it isn't itself an action).
import "server-only";
import { revalidatePath } from "next/cache";
import { BackendError } from "@/lib/backend";

export type ActionResult<T = unknown> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

/**
 * Runs an admin action and turns errors into a message for the form. The backend checks the
 * session, permissions and input; its message ("Product not found.", "Pick a courier…") is shown as-is.
 * On success every admin page is refreshed (the backend refreshes the shop's pages itself).
 */
export async function runAction<T>(fn: () => Promise<T>, message?: string | ((data: T) => string | undefined)): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    revalidatePath("/", "layout");
    return { ok: true, data, message: typeof message === "function" ? message(data) : message };
  } catch (e) {
    if (e instanceof BackendError) return { ok: false, error: e.message };
    console.error("[admin]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}
