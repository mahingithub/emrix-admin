"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import type { StoreSettings } from "@emrix/shared/settings";
import { cn, formatBDT } from "@emrix/shared/utils";
import { saveSettingsAction } from "@/actions/settings";
import { abtn, Card } from "../ui";
import { Field, inputCls, NoticeBar, type Notice } from "../form";

export interface DropOption {
  slug: string;
  name: string;
  status: string;
  sold: number;
}

export function SettingsForm({ settings, products, dropEndsLocal }: { settings: StoreSettings; products: DropOption[]; dropEndsLocal: string }) {
  const router = useRouter();
  const [saving, start] = useTransition();
  const [notice, setNotice] = useState<Notice>(null);

  const [contact, setContact] = useState({ phone: settings.phone, email: settings.email, address: settings.address, hours: settings.hours });
  const [wallets, setWallets] = useState(settings.wallets);
  const [social, setSocial] = useState(settings.social);
  const [delivery, setDelivery] = useState({
    insideDhaka: String(settings.delivery.insideDhaka),
    outsideDhaka: String(settings.delivery.outsideDhaka),
    freeOver: String(settings.delivery.freeOver),
    insideDays: settings.delivery.insideDays,
    outsideDays: settings.delivery.outsideDays,
  });
  const [announcements, setAnnouncements] = useState(settings.announcements.join("\n"));
  const [dropOn, setDropOn] = useState(!!settings.drop);
  const [drop, setDrop] = useState({
    productSlug: settings.drop?.productSlug ?? products[0]?.slug ?? "",
    endsAt: dropEndsLocal,
    total: String(settings.drop?.total ?? 200),
  });

  const save = () =>
    start(async () => {
      setNotice(null);
      const res = await saveSettingsAction({
        ...contact,
        wallets,
        social,
        delivery: {
          insideDhaka: Number(delivery.insideDhaka),
          outsideDhaka: Number(delivery.outsideDhaka),
          freeOver: Number(delivery.freeOver || 0),
          insideDays: delivery.insideDays,
          outsideDays: delivery.outsideDays,
        },
        announcements: announcements
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        drop: dropOn ? { productSlug: drop.productSlug, endsAt: drop.endsAt, total: Number(drop.total) } : null,
      });
      setNotice(res.ok ? { ok: true, text: res.message ?? "Saved." } : { ok: false, text: res.error });
      if (res.ok) router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  const dropProduct = products.find((p) => p.slug === drop.productSlug);
  const free = Number(delivery.freeOver || 0);

  return (
    <div className="pb-24 sm:pb-0">
      <NoticeBar notice={notice} onClose={() => setNotice(null)} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Contact details">
          <p className="-mt-1 mb-4 text-sm text-ink/55">Shown in the shop footer, help page, invoices and the mobile menu. Empty ones are hidden.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone / WhatsApp" hint="Customers call this number.">
              <input className={inputCls} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="+880 1712-345678" inputMode="tel" />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="hello@yourshop.com" inputMode="email" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <input className={inputCls} value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} placeholder="Area, city, postcode" />
            </Field>
            <Field label="Opening hours" className="sm:col-span-2">
              <input className={inputCls} value={contact.hours} onChange={(e) => setContact({ ...contact, hours: e.target.value })} placeholder="Sat – Thu · 10 AM – 10 PM" />
            </Field>
          </div>
        </Card>

        <Card title="bKash & Nagad">
          <p className="-mt-1 mb-4 text-sm text-ink/55">
            Customers <b>Send Money</b> to these numbers at checkout, then you verify the TrxID on the order. Leave one empty to turn it off.
            Cash on Delivery is always on.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="bKash number" hint={wallets.bkash ? "On at checkout" : "Off at checkout"}>
              <input className={inputCls} value={wallets.bkash} onChange={(e) => setWallets({ ...wallets, bkash: e.target.value })} placeholder="01XXXXXXXXX" inputMode="tel" />
            </Field>
            <Field label="Nagad number" hint={wallets.nagad ? "On at checkout" : "Off at checkout"}>
              <input className={inputCls} value={wallets.nagad} onChange={(e) => setWallets({ ...wallets, nagad: e.target.value })} placeholder="01XXXXXXXXX" inputMode="tel" />
            </Field>
          </div>
        </Card>

        <Card title="Delivery">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Inside Dhaka charge (৳)">
              <input className={inputCls} type="number" min={0} value={delivery.insideDhaka} onChange={(e) => setDelivery({ ...delivery, insideDhaka: e.target.value })} />
            </Field>
            <Field label="Inside Dhaka time">
              <input className={inputCls} value={delivery.insideDays} onChange={(e) => setDelivery({ ...delivery, insideDays: e.target.value })} placeholder="1–2 days" />
            </Field>
            <Field label="Outside Dhaka charge (৳)">
              <input className={inputCls} type="number" min={0} value={delivery.outsideDhaka} onChange={(e) => setDelivery({ ...delivery, outsideDhaka: e.target.value })} />
            </Field>
            <Field label="Outside Dhaka time">
              <input className={inputCls} value={delivery.outsideDays} onChange={(e) => setDelivery({ ...delivery, outsideDays: e.target.value })} placeholder="2–4 days" />
            </Field>
            <Field
              label="Free delivery from (৳)"
              className="sm:col-span-2"
              hint={free > 0 ? `Orders of ${formatBDT(free)} or more ship free.` : "0 = no free delivery."}
            >
              <input className={inputCls} type="number" min={0} value={delivery.freeOver} onChange={(e) => setDelivery({ ...delivery, freeOver: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card title="Social links">
          <p className="-mt-1 mb-4 text-sm text-ink/55">Full links, e.g. https://facebook.com/yourpage. Empty ones are hidden in the shop.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(
              [
                ["facebook", "Facebook page", "https://facebook.com/…"],
                ["messenger", "Messenger", "https://m.me/…"],
                ["instagram", "Instagram", "https://instagram.com/…"],
                ["tiktok", "TikTok", "https://tiktok.com/@…"],
              ] as const
            ).map(([key, label, ph]) => (
              <Field key={key} label={label}>
                <input className={inputCls} value={social[key]} onChange={(e) => setSocial({ ...social, [key]: e.target.value })} placeholder={ph} inputMode="url" />
              </Field>
            ))}
          </div>
        </Card>

        <Card title="Announcement bar">
          <p className="-mt-1 mb-3 text-sm text-ink/55">
            One message per line, up to 8. The free-delivery amount and bKash/Nagad lines are added automatically from the settings above.
          </p>
          <textarea
            value={announcements}
            onChange={(e) => setAnnouncements(e.target.value)}
            rows={5}
            className={cn(inputCls, "h-auto py-2.5 leading-relaxed")}
            placeholder={"Cash on Delivery all over Bangladesh\n7-day easy size exchange"}
          />
        </Card>

        <Card
          title="Limited drop"
          action={
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={dropOn} onChange={(e) => setDropOn(e.target.checked)} className="size-4 accent-shu" />
              Show on homepage
            </label>
          }
        >
          <p className="-mt-1 mb-4 text-sm text-ink/55">
            A numbered edition with a countdown on the homepage. &ldquo;Claimed&rdquo; is the product&apos;s real sales, counted against the
            edition size. It disappears when the countdown ends.
          </p>
          {products.length === 0 ? (
            <p className="rounded-xl bg-paper px-3 py-2.5 text-sm text-ink/60">Add a product first.</p>
          ) : (
            <fieldset disabled={!dropOn} className="grid grid-cols-1 gap-4 disabled:opacity-50 sm:grid-cols-2">
              <Field label="Product" className="sm:col-span-2" hint={dropProduct && dropProduct.status !== "active" ? "This product isn't active yet, so the drop stays hidden until you publish it." : undefined}>
                <select className={inputCls} value={drop.productSlug} onChange={(e) => setDrop({ ...drop, productSlug: e.target.value })}>
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                      {p.status !== "active" ? ` (${p.status})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ends (Dhaka time)">
                <input className={inputCls} type="datetime-local" value={drop.endsAt} onChange={(e) => setDrop({ ...drop, endsAt: e.target.value })} />
              </Field>
              <Field label="Edition size" hint={dropProduct ? `${dropProduct.sold} sold so far` : undefined}>
                <input className={inputCls} type="number" min={1} value={drop.total} onChange={(e) => setDrop({ ...drop, total: e.target.value })} />
              </Field>
            </fieldset>
          )}
        </Card>
      </div>

      <div className="mt-6 hidden justify-end sm:flex">
        <button onClick={save} disabled={saving} className={abtn("accent")}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save settings
        </button>
      </div>
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <button onClick={save} disabled={saving} className={abtn("accent", "w-full")}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save settings
        </button>
      </div>
    </div>
  );
}
