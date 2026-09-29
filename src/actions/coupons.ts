"use server";

import type { CouponFormInput } from "@emrix/shared/schemas";
import { send } from "@/lib/backend";
import { runAction } from "./run";

const coupon = (code: string) => `/admin/coupons/${encodeURIComponent(code)}`;

export async function saveCouponAction(existingCode: string | null, input: CouponFormInput) {
  return runAction(
    async () => (await send<{ code: string }>(existingCode ? "PUT" : "POST", existingCode ? coupon(existingCode) : "/admin/coupons", input)).code,
    existingCode ? "Coupon saved." : "Coupon created.",
  );
}

export async function setCouponActiveAction(couponCode: string, active: boolean) {
  return runAction(() => send("POST", `${coupon(couponCode)}/active`, { active: active === true }));
}

export async function deleteCouponAction(couponCode: string) {
  return runAction(() => send("DELETE", coupon(couponCode)), "Coupon deleted.");
}
