"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import { cn, formatBDT } from "@emrix/shared/utils";
import { deleteCouponAction, saveCouponAction, setCouponActiveAction } from "@/actions/coupons";
import { Dialog } from "../dialog";
import { Field, inputCls, numOrUndef } from "../form";
import { abtn, EmptyState } from "../ui";

export interface CouponRow {
  code: string;
  type: "percent" | "flat";
  value: number;
  label: string;
  minOrder?: number;
  maxUses?: number;
  used: number;
  /** Already formatted for display. */
  expires?: string;
  /** "YYYY-MM-DDTHH:mm" in Dhaka time, for the editor. */
  expiresLocal: string;
  expired: boolean;
  active: boolean;
}

export function CouponManager({ rows }: { rows: CouponRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CouponRow | "new" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [, start] = useTransition();

  const run = (code: string, fn: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setBusy(code);
    setError("");
    start(async () => {
      const res = await fn();
      setBusy(null);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setEditing("new")} className={abtn("accent")}>
          <Plus className="size-4" /> New coupon
        </button>
      </div>
      {error && <p className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-white">
          <EmptyState icon={<TicketPercent className="size-6" />} title="No coupons yet">
            Make a code for a sale, a Facebook post or a giveaway. Customers type it at checkout.
          </EmptyState>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <ul className="divide-y divide-ink/[0.06]">
            {rows.map((c) => {
              const live = c.active && !c.expired && !(c.maxUses && c.used >= c.maxUses);
              return (
                <li key={c.code} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={cn("rounded-lg border-2 border-dashed px-2.5 py-1 font-mono text-sm font-bold", live ? "border-shu text-shu" : "border-ink/20 text-ink/40")}>
                      {c.code}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">{c.label}</p>
                      <p className="text-xs text-ink/55">
                        {[
                          c.minOrder && `min. order ${formatBDT(c.minOrder)}`,
                          `used ${c.used}${c.maxUses ? ` of ${c.maxUses}` : ""}`,
                          c.expires && (c.expired ? `ended ${c.expires}` : `ends ${c.expires}`),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={c.active}
                        disabled={busy === c.code}
                        onChange={(e) => run(c.code, () => setCouponActiveAction(c.code, e.target.checked))}
                        className="size-4 accent-shu"
                      />
                      {busy === c.code ? <Loader2 className="size-4 animate-spin" /> : c.active ? "On" : "Off"}
                    </label>
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(c)} className={abtn("ghost")} aria-label={`Edit ${c.code}`} title="Edit">
                        <Pencil className="size-4" />
                      </button>
                      {c.used === 0 && (
                        <button
                          onClick={() => confirm(`Delete ${c.code}?`) && run(c.code, () => deleteCouponAction(c.code))}
                          className={abtn("ghost", "text-rose-600 hover:bg-rose-50 hover:text-rose-700")}
                          aria-label={`Delete ${c.code}`}
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {editing && <CouponDialog coupon={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function CouponDialog({ coupon, onClose }: { coupon: CouponRow | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: coupon?.code ?? "",
    type: coupon?.type ?? ("percent" as "percent" | "flat"),
    value: coupon ? String(coupon.value) : "",
    minOrder: coupon?.minOrder ? String(coupon.minOrder) : "",
    maxUses: coupon?.maxUses ? String(coupon.maxUses) : "",
    expiresAt: coupon?.expiresLocal ?? "",
    active: coupon?.active ?? true,
  });

  const submit = () =>
    start(async () => {
      setError("");
      const res = await saveCouponAction(coupon?.code ?? null, {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrder: numOrUndef(form.minOrder),
        maxUses: numOrUndef(form.maxUses),
        expiresAt: form.expiresAt || undefined,
        active: form.active,
      });
      if (res.ok) {
        router.refresh();
        onClose();
      } else setError(res.error);
    });

  return (
    <Dialog open onClose={onClose} title={coupon ? `Edit ${coupon.code}` : "New coupon"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <Field label="Code" hint={coupon ? "Codes can't be renamed once created." : "Letters and numbers, e.g. EID25. Customers type this at checkout."}>
          <input
            className={cn(inputCls, "font-mono uppercase")}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
            maxLength={20}
            required
            disabled={!!coupon}
            autoFocus={!coupon}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Discount type">
            <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "flat" })}>
              <option value="percent">Percent off</option>
              <option value="flat">Taka off</option>
            </select>
          </Field>
          <Field label={form.type === "percent" ? "Percent (%)" : "Amount (৳)"}>
            <input className={inputCls} type="number" min={1} max={form.type === "percent" ? 90 : 20000} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
          </Field>
          <Field label="Minimum order (৳)" hint="Optional">
            <input className={inputCls} type="number" min={0} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
          </Field>
          <Field label="Usage limit" hint="Optional, total uses">
            <input className={inputCls} type="number" min={1} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
          </Field>
        </div>
        <Field label="Ends (Dhaka time)" hint="Optional. Leave empty to run until you turn it off.">
          <input className={inputCls} type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="size-4 accent-shu" />
          Active: customers can use it now
        </label>
        {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}
        <button disabled={pending} className={abtn("accent", "w-full")}>
          {pending && <Loader2 className="size-4 animate-spin" />} {coupon ? "Save coupon" : "Create coupon"}
        </button>
      </form>
    </Dialog>
  );
}
