"use server";

import type { SettingsFormInput } from "@emrix/shared/schemas";
import { send } from "@/lib/backend";
import { runAction } from "./run";

export async function saveSettingsAction(input: SettingsFormInput) {
  return runAction(() => send("PUT", "/admin/settings", input), "Settings saved. The shop is updated.");
}
