// Input rules for everything the frontend and admin panel send to the backend. The backend
// validates every request with these; the apps use the inferred types for their forms.
import { z } from "zod";
import { MIN_PASSWORD, ROLES, type AdminRole } from "./admin";
import { SIZES } from "./catalog";
import { DIVISIONS } from "./districts";
import { PAYMENT_LABEL } from "./orders";
import { SCENE_KEYS, type SceneKey } from "./scenes";
import { fromDhakaInput } from "./time";
import type { Size } from "./types";
import { normalizeBdPhone } from "./utils";

const sizeEnum = z.enum(SIZES as [Size, ...Size[]]);

/* --- Checkout -------------------------------------------------------------------------------- */

const DISTRICTS = new Set(Object.values(DIVISIONS).flat());

const bdPhone = (message: string) =>
  z.string().refine((v) => normalizeBdPhone(v) !== null, { message }).transform((v) => normalizeBdPhone(v)!);

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name.").max(80),
    phone: bdPhone("Enter a valid 11-digit number, e.g. 01712345678."),
    email: z
      .string()
      .trim()
      .max(120)
      .refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "That email doesn't look right."),
    district: z.string().refine((v) => DISTRICTS.has(v), "Select your district."),
    area: z.string().trim().min(2, "Enter your area or thana.").max(80),
    address: z.string().trim().min(6, "Add house, road and landmark so the rider can find you.").max(300),
    note: z.string().trim().max(300),
    payment: z.enum(["cod", "bkash", "nagad"]),
    sender: z.string(),
    trxId: z.string().trim().toUpperCase(),
    coupon: z.string().trim().toUpperCase().max(40).optional(),
    items: z
      .array(
        z.object({
          productId: z.string(),
          colorName: z.string(),
          size: sizeEnum,
          qty: z.number().int().min(1).max(10),
        }),
      )
      .min(1, "Your cart is empty.")
      .max(30),
  })
  .superRefine((v, ctx) => {
    if (v.payment === "cod") return;
    if (!normalizeBdPhone(v.sender)) {
      ctx.addIssue({ code: "custom", path: ["sender"], message: `Enter the ${PAYMENT_LABEL[v.payment]} number you paid from.` });
    }
    if (!/^[A-Z0-9]{6,20}$/.test(v.trxId)) {
      ctx.addIssue({ code: "custom", path: ["trxId"], message: "Enter the transaction ID from your payment SMS." });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;

export const couponCheckSchema = z.object({ code: z.string().max(200), subtotal: z.number().finite() });

export const trackSchema = z.object({ code: z.string().max(20), phone: z.string().max(40) });

/* --- Try-on ---------------------------------------------------------------------------------- */

export const tryOnSchema = z.object({
  product: z.string().min(1).max(120),
  color: z.string().min(1).max(60),
  // The browser shrinks photos to 1280 px JPEGs first, so this is generous.
  photo: z
    .string()
    .max(8_000_000)
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/),
});

/* --- Admin: sign-in and accounts ------------------------------------------------------------- */

export const loginSchema = z.object({ email: z.string().max(200), password: z.string().max(200) });

export const ownerSchema = z
  .object({
    key: z.string().max(500),
    name: z.string().trim().min(2, "Enter your name.").max(60),
    email: z.string().trim().toLowerCase().max(120).regex(/^\S+@\S+\.\S+$/, "Enter a valid email."),
    password: z.string().min(MIN_PASSWORD, `Use at least ${MIN_PASSWORD} characters for the password.`).max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "The two passwords don't match.", path: ["confirm"] });

export type OwnerInput = z.input<typeof ownerSchema>;

const staffName = z.string().trim().min(2, "Enter their full name.").max(60);
const staffEmail = z.string().trim().toLowerCase().max(120).regex(/^\S+@\S+\.\S+$/, "Enter a valid email.");
const role = z.enum(ROLES as [AdminRole, ...AdminRole[]]);
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD, `Passwords need at least ${MIN_PASSWORD} characters.`)
  .max(200, "That password is too long.");

export const newStaffSchema = z.object({ name: staffName, email: staffEmail, role, password: passwordSchema });
export type NewStaffInput = z.input<typeof newStaffSchema>;

export const staffUpdateSchema = z.object({ name: staffName, email: staffEmail, role, active: z.boolean() });
export type StaffUpdateInput = z.input<typeof staffUpdateSchema>;

export const renameSchema = z.object({ name: staffName });

export const ownPasswordSchema = z.object({ current: z.string().max(200), next: passwordSchema });

/* --- Admin: orders --------------------------------------------------------------------------- */

export const orderStatusSchema = z.enum(["placed", "confirmed", "printing", "shipped", "delivered", "cancelled", "returned"]);
export const orderCodeSchema = z.string().max(20);

/* --- Admin: catalogue ------------------------------------------------------------------------ */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colours must be hex values like #17171b.");
const slug = z
  .string()
  .trim()
  .min(2, "Slug is too short.")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only use lowercase letters, numbers and dashes.");
const mediaUrl = z.string().regex(/^\/media\/[a-z0-9]+-[a-f0-9]{12}\.(webp|jpg|png|avif)$/, "Invalid image.");

const videoSchema = z.object({
  url: z.string().regex(/^\/media\/[a-z0-9]+-[a-f0-9]{12}\.mp4$/, "Invalid video."),
  poster: mediaUrl.optional(),
  color: z.string().max(40).optional(),
});

export const imageSchema = z.object({
  id: z.string().max(40),
  url: mediaUrl,
  alt: z.string().max(160),
  color: z.string().max(40).optional(),
  back: z.boolean().optional(),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(3, "Give the product a name.").max(80),
    slug,
    jp: z.string().trim().max(40),
    anime: z.string().min(1, "Pick an anime collection."),
    fit: z.enum(["regular", "oversized"]),
    price: z.number().int().min(100, "Price looks too low.").max(20000, "Price looks too high (max ৳20,000)."),
    compareAt: z.number().int().max(40000, "Compare-at price looks too high.").optional(),
    colors: z
      .array(
        z.object({
          // Colour names key the stock records, so they can't contain "." or "$".
          name: z.string().trim().min(1, "Every colour needs a name.").max(30).regex(/^[^.$]+$/, "Colour names can't contain \".\" or \"$\"."),
          hex,
        }),
      )
      .min(1, "Add at least one colour.")
      .max(8),
    badges: z.array(z.enum(["new", "bestseller", "limited"])).max(3),
    description: z.string().trim().max(600),
    status: z.enum(["active", "draft", "archived"]),
    images: z.array(imageSchema).max(20),
    video: videoSchema.optional(),
    stock: z.record(z.string(), z.partialRecord(sizeEnum, z.number().int().min(0).max(9999, "Stock per size can't exceed 9,999."))),
    lowStockAt: z.number().int().min(0).max(100, "Low-stock alert must be 100 or less."),
    art: z.object({
      kanji: z.string().trim().min(1, "Artwork needs at least one character.").max(6),
      sub: z.string().trim().min(1, "Artwork needs a subtitle.").max(24),
      motif: z.enum(["hinomaru", "burst", "slash", "spiral", "box", "vertical", "checker", "wave"]),
      accent: hex,
    }),
  })
  .superRefine((v, ctx) => {
    if (v.compareAt !== undefined && v.compareAt <= v.price) {
      ctx.addIssue({ code: "custom", path: ["compareAt"], message: "Compare-at price must be higher than the price." });
    }
    const names = v.colors.map((c) => c.name.toLowerCase());
    if (new Set(names).size !== names.length) ctx.addIssue({ code: "custom", path: ["colors"], message: "Colour names must be unique." });
  });

export type ProductFormInput = z.input<typeof productSchema>;

export const productStatusSchema = z.enum(["active", "draft", "archived"]);

export const attachPhotosSchema = z.array(z.object({ productId: z.string().max(40), images: z.array(imageSchema).max(20) })).max(200);
export type PhotoAssignment = z.input<typeof attachPhotosSchema>[number];

export const stockSchema = z.object({
  productId: z.string().max(40),
  color: z.string().max(40),
  size: sizeEnum,
  value: z.number().int().min(0).max(9999),
  reason: z.enum(["restock", "damaged", "correction"]),
});
export type StockInput = z.input<typeof stockSchema>;

export const animeSchema = z.object({
  slug,
  name: z.string().trim().min(2, "Name is too short.").max(40),
  jp: z.string().trim().max(30),
  kanji: z.string().trim().min(1, "Add a kanji or character.").max(2),
  color: hex,
  onColor: hex,
  tint: hex,
  blurb: z.string().trim().max(160),
  cover: mediaUrl.optional(),
  scene: z.enum(SCENE_KEYS as [SceneKey, ...SceneKey[]]).optional(),
  active: z.boolean(),
});

export type AnimeFormInput = z.input<typeof animeSchema>;

export const reorderSchema = z.array(z.string()).max(100);

/* --- Admin: coupons -------------------------------------------------------------------------- */

export const couponCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{3,20}$/, "Codes use 3–20 letters and numbers, e.g. EID25.");

export const couponSchema = z
  .object({
    code: couponCodeSchema,
    type: z.enum(["percent", "flat"]),
    value: z.number({ error: "Enter the discount." }).int("Use a whole number.").min(1, "Enter the discount."),
    minOrder: z.number().int().min(0).max(1_000_000).optional(),
    maxUses: z.number().int().min(1).max(1_000_000).optional(),
    expiresAt: z.string().optional(),
    active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "percent" && v.value > 90) ctx.addIssue({ code: "custom", path: ["value"], message: "Percentage discounts go up to 90%." });
    if (v.type === "flat" && v.value > 20_000) ctx.addIssue({ code: "custom", path: ["value"], message: "That discount looks too high." });
    if (v.expiresAt && !fromDhakaInput(v.expiresAt)) ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Pick a valid end date." });
  });

export type CouponFormInput = z.input<typeof couponSchema>;

/* --- Admin: settings ------------------------------------------------------------------------- */

const text = (max: number, label: string) => z.string().trim().max(max, `${label} is too long.`);
const wallet = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || normalizeBdPhone(v) !== null, `Enter the ${label} number as 11 digits, e.g. 01712345678.`)
    .transform((v) => (v ? normalizeBdPhone(v)! : ""));
const link = (label: string) =>
  z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https:\/\/[^\s]+\.[^\s]+$/.test(v), `${label} must be a full link starting with https://`);
const fee = (label: string, max: number) =>
  z.number({ error: `Enter the ${label}.` }).int(`${label} must be a whole number.`).min(0).max(max, `${label} looks too high.`);

export const settingsSchema = z.object({
  phone: text(40, "Phone"),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "That email doesn't look right."),
  address: text(200, "Address"),
  hours: text(80, "Opening hours"),
  wallets: z.object({ bkash: wallet("bKash"), nagad: wallet("Nagad") }),
  social: z.object({
    facebook: link("Facebook"),
    instagram: link("Instagram"),
    tiktok: link("TikTok"),
    messenger: link("Messenger"),
  }),
  delivery: z.object({
    insideDhaka: fee("Inside Dhaka charge", 2000),
    outsideDhaka: fee("Outside Dhaka charge", 5000),
    freeOver: fee("Free delivery amount", 1_000_000),
    insideDays: text(30, "Inside Dhaka time").min(1, "Say how long delivery takes inside Dhaka."),
    outsideDays: text(30, "Outside Dhaka time").min(1, "Say how long delivery takes outside Dhaka."),
  }),
  announcements: z.array(z.string().trim().max(120, "Keep each announcement under 120 characters.")).max(8, "Up to 8 announcements."),
  drop: z
    .object({
      productSlug: z.string().min(1, "Pick the drop's product."),
      // Dhaka time as typed in <input type="datetime-local">; the backend turns it into an ISO time.
      endsAt: z.string(),
      total: z.number().int().min(1, "Edition size must be at least 1.").max(100_000),
    })
    .nullable(),
});

export type SettingsFormInput = z.input<typeof settingsSchema>;
