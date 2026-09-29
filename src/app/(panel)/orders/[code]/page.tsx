import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CircleDot,
  CreditCard,
  Mail,
  MapPin,
  MessageCircle,
  NotebookPen,
  Phone,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { can } from "@emrix/shared/admin";
import { PAYMENT_LABEL, type OrderEvent } from "@emrix/shared/orders";
import { fmtDate, fmtDateTime, timeAgo } from "@emrix/shared/time";
import { cn, formatBDT } from "@emrix/shared/utils";
import { ProductVisual } from "@emrix/shared/ui/product-visual";
import { CopyButton } from "@emrix/shared/ui/copy-button";
import { Card, PaymentBadge, RiskBadge, StatusBadge } from "@/components/ui";
import { CourierEditor, NoteForm, OrderActions, PaymentReview } from "@/components/orders/order-controls";
import { requireAdmin } from "@/lib/auth";
import { findProductsByIds, getAllAnimes, getCustomerHistory, getOrder, getSettings } from "@/lib/backend";
import { shopUrl } from "@/lib/shop";

export async function generateMetadata({ params }: PageProps<"/orders/[code]">): Promise<Metadata> {
  return { title: `Order ${(await params).code}` };
}

const EVENT_ICON: Record<OrderEvent["type"], typeof Truck> = {
  created: CircleDot,
  status: CircleDot,
  payment: CreditCard,
  shipping: Truck,
  note: NotebookPen,
};

export default async function OrderDetailPage({ params }: PageProps<"/orders/[code]">) {
  const admin = await requireAdmin();
  const { code } = await params;
  const order = await getOrder(code);
  if (!order) notFound();

  const [history, animes, products, settings] = await Promise.all([
    getCustomerHistory(order.customer.phone),
    getAllAnimes(),
    findProductsByIds(order.lines.map((l) => l.productId)),
    getSettings(),
  ]);
  const getAnime = (slug: string) => animes.find((a) => a.slug === slug);
  const others = history.recent.filter((o) => o.code !== order.code);
  const intlPhone = `88${order.customer.phone}`;
  const waText = encodeURIComponent(
    `Assalamu alaikum ${order.customer.name.split(" ")[0]}, this is EMRIX. We're confirming your order ${order.code} of ${formatBDT(order.total)}. Is the delivery address correct?`,
  );
  const events = [...order.events].reverse();
  const prepaidPending = order.payment.method !== "cod" && order.paymentStatus === "pending";
  const items = order.lines.reduce((n, l) => n + l.qty, 0);
  const wallet = order.payment.method === "bkash" ? settings.wallets.bkash : settings.wallets.nagad;

  return (
    <>
      <Link href="/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
        <ArrowLeft className="size-4" /> Orders
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">{order.code}</h1>
            <CopyButton value={order.code} label="Copy order ID" className="size-8 rounded-lg text-ink/50 hover:bg-ink/5 hover:text-ink" />
            <StatusBadge status={order.status} className="text-sm" />
          </div>
          <p className="mt-1.5 text-sm text-ink/60">
            Placed {fmtDateTime(order.createdAt)} ({timeAgo(order.createdAt)}) · {items} item{items === 1 ? "" : "s"} ·{" "}
            {formatBDT(order.total)} · Website
          </p>
        </div>
        <OrderActions
          code={order.code}
          status={order.status}
          courier={order.courier}
          canCancel={can(admin.role, "orders:cancel")}
          prepaidPending={prepaidPending}
        />
      </div>

      {history.risk === "high" && order.status === "placed" && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-bold">High-risk customer</p>
            <p className="mt-0.5 text-rose-900/80">
              This number has {history.cancelled} cancelled and {history.returned} returned order
              {history.cancelled + history.returned === 1 ? "" : "s"} against {history.delivered} delivered. Call to confirm
              before printing, and consider asking for the delivery charge in advance.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title={`Items (${items})`} bodyClassName="p-0">
            <ul className="divide-y divide-ink/[0.06]">
              {order.lines.map((l) => {
                const product = products.find((p) => p.id === l.productId);
                const color = product?.colors.find((c) => c.name === l.colorName);
                return (
                  <li key={`${l.productId}-${l.colorName}-${l.size}`} className="flex items-center gap-4 px-5 py-4">
                    <span
                      className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-ink/10"
                      style={{ backgroundColor: getAnime(l.anime)?.tint }}
                    >
                      {product && <ProductVisual product={product} color={color} className="absolute inset-1" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link href={shopUrl(`/product/${l.slug}`)} target="_blank" className="font-semibold hover:text-shu">
                        {l.name}
                      </Link>
                      <p className="text-xs text-ink/55">{getAnime(l.anime)?.name}</p>
                      <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
                        <span className="rounded-md bg-paper px-1.5 py-0.5 font-semibold">{l.colorName}</span>
                        <span className="rounded-md bg-ink px-1.5 py-0.5 font-bold text-paper">{l.size}</span>
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-ink/55">
                        {l.qty} × {formatBDT(l.price)}
                      </p>
                      <p className="font-semibold tabular-nums">{formatBDT(l.qty * l.price)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="space-y-1.5 border-t border-ink/[0.07] px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/60">Subtotal</dt>
                <dd className="tabular-nums">{formatBDT(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/60">Delivery ({order.shipping.zone === "inside" ? "inside" : "outside"} Dhaka)</dt>
                <dd className="tabular-nums">{order.delivery ? formatBDT(order.delivery) : "Free"}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink/60">Discount ({order.coupon})</dt>
                  <dd className="tabular-nums text-shu">−{formatBDT(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-ink/[0.07] pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatBDT(order.total)}</dd>
              </div>
              {order.payment.method === "cod" && order.paymentStatus !== "paid" && order.status !== "cancelled" && (
                <div className="flex justify-between rounded-lg bg-kin/25 px-2 py-1.5 font-semibold">
                  <dt>Rider collects (COD)</dt>
                  <dd className="tabular-nums">{formatBDT(order.total)}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="Timeline">
            <NoteForm code={order.code} />
            <ol className="space-y-4">
              {events.map((e) => {
                const Icon = EVENT_ICON[e.type];
                return (
                  <li key={e.id} className="flex gap-3">
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full",
                        e.internal ? "bg-kin/35 text-ink" : e.status === "cancelled" || e.status === "returned" ? "bg-rose-50 text-rose-600" : "bg-paper text-ink/60",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 pt-1">
                      <p className="text-sm">
                        {e.message}
                        {e.internal && (
                          <span className="ml-2 rounded bg-kin/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">Internal</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/50">
                        {fmtDateTime(e.at)}
                        {e.actor ? ` · ${e.actor}` : e.type === "created" ? " · Customer" : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Customer">
            <p className="font-semibold">{order.customer.name}</p>
            <div className="mt-1 flex items-center gap-1 text-sm text-ink/70">
              <span className="font-mono">{order.customer.phone}</span>
              <CopyButton value={order.customer.phone} label="Copy phone" className="size-7 rounded-md text-ink/40 hover:bg-ink/5 hover:text-ink" />
            </div>
            {order.customer.email && (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink/60">
                <Mail className="size-3.5" /> {order.customer.email}
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={`tel:+${intlPhone}`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-ink text-sm font-semibold text-paper hover:bg-ink/85">
                <Phone className="size-4" /> Call
              </a>
              <a
                href={`https://wa.me/${intlPhone}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#1f8f4e] text-sm font-semibold text-white hover:bg-[#187a41]"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </div>

            <div className="mt-4 border-t border-ink/[0.07] pt-4">
              <RiskBadge risk={history.risk} />
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-paper px-2 py-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink/50">Orders</dt>
                  <dd className="text-lg font-bold">{history.orders}</dd>
                </div>
                <div className="rounded-xl bg-paper px-2 py-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink/50">Delivered</dt>
                  <dd className="text-lg font-bold">{history.delivered}</dd>
                </div>
                <div className="rounded-xl bg-paper px-2 py-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink/50">Failed</dt>
                  <dd className={cn("text-lg font-bold", history.cancelled + history.returned > 0 && "text-rose-600")}>
                    {history.cancelled + history.returned}
                  </dd>
                </div>
              </dl>
              {can(admin.role, "revenue:view") && history.spent > 0 && (
                <p className="mt-2 text-xs text-ink/55">
                  Lifetime spend {formatBDT(history.spent)} · customer since {fmtDate(history.firstOrderAt)}
                </p>
              )}
              {others.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {others.map((o) => (
                    <li key={o.code}>
                      <Link href={`/orders/${o.code}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-paper">
                        <span className="font-mono font-semibold">{o.code}</span>
                        <StatusBadge status={o.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card title="Delivery">
            <p className="flex gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ink/40" />
              <span>
                {order.shipping.address}
                <br />
                {order.shipping.area}, {order.shipping.district}
              </span>
            </p>
            <p className="mt-2 text-xs text-ink/55">
              {order.shipping.zone === "inside" ? "Inside Dhaka" : "Outside Dhaka"} · delivery charge{" "}
              {order.delivery ? formatBDT(order.delivery) : "free"}
            </p>
            {order.shipping.note && (
              <p className="mt-3 rounded-lg bg-kin/20 px-3 py-2 text-sm">
                <b>Rider note:</b> {order.shipping.note}
              </p>
            )}
            <div className="mt-4 border-t border-ink/[0.07] pt-4">
              {order.courier ? (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="size-4 text-ink/40" />
                  <span className="font-semibold">{order.courier.name}</span>
                  <span className="font-mono text-ink/70">{order.courier.trackingNo}</span>
                  <CopyButton value={order.courier.trackingNo} label="Copy tracking number" className="size-7 rounded-md text-ink/40 hover:bg-ink/5" />
                </div>
              ) : (
                <p className="text-sm text-ink/55">No courier assigned yet.</p>
              )}
              {["confirmed", "printing", "shipped"].includes(order.status) && (
                <div className="mt-1">
                  <CourierEditor code={order.code} courier={order.courier} />
                </div>
              )}
            </div>
          </Card>

          <Card title="Payment">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{PAYMENT_LABEL[order.payment.method]}</span>
              <PaymentBadge status={order.paymentStatus} />
            </div>
            {order.payment.method !== "cod" && (
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink/55">Sender</dt>
                  <dd className="font-mono">{order.payment.sender}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink/55">TrxID</dt>
                  <dd className="flex items-center gap-1 font-mono">
                    {order.payment.trxId}
                    <CopyButton value={order.payment.trxId ?? ""} label="Copy TrxID" className="size-6 rounded text-ink/40 hover:bg-ink/5" />
                  </dd>
                </div>
              </dl>
            )}
            {prepaidPending && (
              <div className="mt-4">
                <PaymentReview
                  code={order.code}
                  method={order.payment.method}
                  total={order.total}
                  sender={order.payment.sender}
                  trxId={order.payment.trxId}
                  canVerify={can(admin.role, "payments:verify")}
                  wallet={wallet}
                />
              </div>
            )}
            {order.payment.method === "cod" && (
              <p className="mt-2 text-xs text-ink/55">
                {order.paymentStatus === "paid" ? "Collected by the rider on delivery." : "Marked paid automatically when delivered."}
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
