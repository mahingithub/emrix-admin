import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PAYMENT_LABEL } from "@emrix/shared/orders";
import { fmtDateTime } from "@emrix/shared/time";
import { formatBDT } from "@emrix/shared/utils";
import { Logo } from "@emrix/shared/ui/logo";
import { PrintButton } from "@/components/print-button";
import { requireAdmin } from "@/lib/auth";
import { getAllAnimes, getOrder, getSettings } from "@/lib/backend";

export async function generateMetadata({ params }: PageProps<"/orders/[code]/invoice">): Promise<Metadata> {
  return { title: `Invoice ${(await params).code}` };
}

export default async function InvoicePage({ params }: PageProps<"/orders/[code]/invoice">) {
  await requireAdmin();
  const order = await getOrder((await params).code);
  if (!order) notFound();
  const [settings, animes] = await Promise.all([getSettings(), getAllAnimes()]);
  const getAnime = (slug: string) => animes.find((a) => a.slug === slug);
  const cod = order.payment.method === "cod" && order.paymentStatus !== "paid";

  return (
    <div className="min-h-screen bg-[#e9e6df] py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[720px] items-center justify-between px-4 print:hidden">
        <Link href={`/orders/${order.code}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
          <ArrowLeft className="size-4" /> Back to order
        </Link>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-[720px] bg-white p-8 text-ink shadow-xl print:max-w-none print:p-0 print:shadow-none sm:p-12">
        <header className="flex items-start justify-between gap-6 border-b-2 border-ink pb-6">
          <div>
            <Logo />
            <p className="mt-3 text-xs leading-relaxed text-ink/60">
              {settings.address}
              {settings.address && (settings.phone || settings.email) && <br />}
              {[settings.phone, settings.email].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-jp text-xs font-bold tracking-[0.3em] text-shu">請求書</p>
            <p className="font-display text-3xl uppercase leading-none">Invoice</p>
            <p className="mt-2 font-mono text-sm font-bold">{order.code}</p>
            <p className="text-xs text-ink/60">{fmtDateTime(order.createdAt)}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 py-6 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Ship to</p>
            <p className="mt-1 font-bold">{order.customer.name}</p>
            <p>{order.customer.phone}</p>
            <p className="text-ink/75">
              {order.shipping.address}, {order.shipping.area}, {order.shipping.district}
            </p>
            {order.shipping.note && <p className="mt-1 text-xs italic text-ink/60">Note: {order.shipping.note}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Payment</p>
            <p className="mt-1 font-bold">{PAYMENT_LABEL[order.payment.method]}</p>
            {order.payment.trxId && <p className="font-mono text-xs">TrxID {order.payment.trxId}</p>}
            {order.courier && (
              <>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-ink/50">Courier</p>
                <p className="font-bold">{order.courier.name}</p>
                <p className="font-mono text-xs">{order.courier.trackingNo}</p>
              </>
            )}
          </div>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-ink/20 text-left text-[11px] uppercase tracking-wider text-ink/60">
              <th className="py-2 font-bold">Item</th>
              <th className="py-2 font-bold">Size</th>
              <th className="py-2 text-right font-bold">Qty</th>
              <th className="py-2 text-right font-bold">Price</th>
              <th className="py-2 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {order.lines.map((l) => (
              <tr key={`${l.productId}-${l.colorName}-${l.size}`}>
                <td className="py-2.5">
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-xs text-ink/55">
                    {getAnime(l.anime)?.name} · {l.colorName}
                  </p>
                </td>
                <td className="py-2.5 font-bold">{l.size}</td>
                <td className="py-2.5 text-right tabular-nums">{l.qty}</td>
                <td className="py-2.5 text-right tabular-nums">{formatBDT(l.price)}</td>
                <td className="py-2.5 text-right tabular-nums">{formatBDT(l.price * l.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <dl className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/60">Subtotal</dt>
              <dd className="tabular-nums">{formatBDT(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/60">Delivery</dt>
              <dd className="tabular-nums">{order.delivery ? formatBDT(order.delivery) : "Free"}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink/60">Discount ({order.coupon})</dt>
                <dd className="tabular-nums">−{formatBDT(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-ink pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatBDT(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex items-center justify-between gap-6 rounded-xl border-2 border-dashed border-ink p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50">
              {cod ? "Collect from customer" : "Payment status"}
            </p>
            <p className="font-display text-3xl">{cod ? formatBDT(order.total) : "PAID"}</p>
          </div>
          <p className="max-w-[16rem] text-right text-xs text-ink/60">
            Thank you for shopping with EMRIX! Size exchange within 7 days. <span className="font-jp">ありがとう</span>
          </p>
        </div>
      </article>
    </div>
  );
}
