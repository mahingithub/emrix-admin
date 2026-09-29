import { PAYMENT_LABEL, STATUS_LABEL, type OrderStatus, type PaymentMethod, type PaymentStatus, type Zone } from "@emrix/shared/orders";
import { dhakaDayKey, formatDhaka } from "@emrix/shared/time";
import { getCurrentAdmin } from "@/lib/auth";
import { getAllAnimes, listOrders } from "@/lib/backend";

const csv = (v: string | number | undefined) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV of the currently filtered orders (e.g. for courier bulk upload). */
export async function GET(request: Request) {
  if (!(await getCurrentAdmin())) return new Response("Unauthorized", { status: 401 });
  const sp = new URL(request.url).searchParams;
  const { rows } = await listOrders({
    status: (sp.get("status") as OrderStatus | null) ?? "all",
    q: sp.get("q") ?? undefined,
    payment: (sp.get("payment") as PaymentMethod | null) ?? undefined,
    paymentStatus: (sp.get("paymentStatus") as PaymentStatus | null) ?? undefined,
    zone: (sp.get("zone") as Zone | null) ?? undefined,
    pageSize: 100_000,
  });

  const animes = await getAllAnimes();
  const getAnime = (slug: string) => animes.find((a) => a.slug === slug);
  const header = [
    "Order", "Placed (Dhaka)", "Status", "Payment method", "Payment status", "Customer", "Phone",
    "District", "Area", "Address", "Items", "Subtotal", "Delivery", "Discount", "Total", "COD to collect", "Courier", "Tracking",
  ];
  const lines = rows.map((o) =>
    [
      o.code,
      formatDhaka(o.createdAt, { dateStyle: "medium", timeStyle: "short" }),
      STATUS_LABEL[o.status],
      PAYMENT_LABEL[o.payment.method],
      o.paymentStatus,
      o.customer.name,
      o.customer.phone,
      o.shipping.district,
      o.shipping.area,
      o.shipping.address,
      o.lines.map((l) => `${l.name} [${getAnime(l.anime)?.name}] ${l.colorName}/${l.size} x${l.qty}`).join("; "),
      o.subtotal,
      o.delivery,
      o.discount,
      o.total,
      o.payment.method === "cod" && o.paymentStatus !== "paid" && o.status !== "cancelled" ? o.total : 0,
      o.courier?.name,
      o.courier?.trackingNo,
    ]
      .map(csv)
      .join(","),
  );

  return new Response("﻿" + [header.join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="emrix-orders-${dhakaDayKey(Date.now())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
