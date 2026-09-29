"use server";

import type { NewStaffInput, StaffUpdateInput } from "@emrix/shared/schemas";
import { send } from "@/lib/backend";
import { runAction } from "./run";

const staff = (id: string) => `/admin/staff/${encodeURIComponent(id)}`;

export async function createStaffAction(input: NewStaffInput) {
  return runAction(() => send("POST", "/admin/staff", input), "Account created. Share the email and password with them privately.");
}

export async function updateStaffAction(staffId: string, input: StaffUpdateInput) {
  return runAction(() => send("PUT", staff(staffId), input), "Saved.");
}

export async function resetStaffPasswordAction(staffId: string, newPassword: string) {
  return runAction(() => send("POST", `${staff(staffId)}/password`, { password: newPassword }), "Password changed. They'll need to sign in again.");
}

/* --- Your own account (any role) ------------------------------------ */

export async function renameSelfAction(newName: string) {
  return runAction(() => send("POST", "/admin/account/name", { name: newName }), "Name updated.");
}

export async function changeOwnPasswordAction(current: string, next: string) {
  return runAction(() => send("POST", "/admin/account/password", { current: String(current), next }), "Password changed. Other devices have been signed out.");
}
