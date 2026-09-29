"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Ban, Check, CheckCircle2, Loader2, PackageOpen, Printer, Truck, Undo2, X } from "lucide-react";
import { canTransition, COURIERS, PAYMENT_LABEL, type OrderStatus, type PaymentMethod } from "@emrix/shared/orders";
import { cn, formatBDT } from "@emrix/shared/utils";
import {
  addNoteAction,
  setCourierAction,
  updateOrderStatusAction,
  verifyPaymentAction,
  type ActionResult,
} from "@/actions/admin";
import { Dialog } from "../dialog";
import { abtn } from "../ui";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const run = (fn: () => Promise<ActionResult>, onOk?: () => void) =>
    start(async () => {
      setError("");
      const res = await fn();
      if (res.ok) {
        onOk?.();
        router.refresh();
      } else setError(res.error);
    });
  return { pending, error, run, setError };
}

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string; Icon: typeof Check }>> = {
  placed: { to: "confirmed", label: "Confirm order", Icon: CheckCircle2 },
  confirmed: { to: "printing", label: "Start printing", Icon: Printer },
  printing: { to: "shipped", label: "Mark as shipped", Icon: PackageOpen },
  shipped: { to: "delivered", label: "Mark delivered", Icon: Truck },
};

const CANCEL_REASONS = [
  "Customer unreachable after 3 calls",
  "Customer cancelled",
  "Fake / prank order",
  "Duplicate order",
  "Out of stock",
];
const RETURN_REASONS = ["Customer refused at door", "Customer not home, 3 delivery attempts", "Size exchange requested"];

export function OrderActions({
  code,
  status,
  courier,
  canCancel,
  prepaidPending,
}: {
  code: string;
  status: OrderStatus;
  courier?: { name: string; trackingNo: string };
  canCancel: boolean;
  prepaidPending: boolean;
}) {
  const { pending, error, run } = useAction();
  const [dialog, setDialog] = useState<"ship" | "cancel" | "return" | null>(null);
  const close = useCallback(() => setDialog(null), []);
  const next = NEXT[status];

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <a href={`/orders/${code}/invoice`} target="_blank" className={abtn("outline")}>
          <Printer className="size-4" /> Invoice
        </a>
        {canCancel && canTransition(status, "cancelled") && (
          <button onClick={() => setDialog("cancel")} className={abtn("danger")}>
            <Ban className="size-4" /> Cancel
          </button>
        )}
        {canCancel && canTransition(status, "returned") && (
          <button onClick={() => setDialog("return")} className={abtn("danger")}>
            <Undo2 className="size-4" /> Mark returned
          </button>
        )}
        {next && (
          <button
            disabled={pending}
            onClick={() => (next.to === "shipped" ? setDialog("ship") : run(() => updateOrderStatusAction(code, next.to)))}
            className={abtn("accent")}
            title={prepaidPending && next.to === "confirmed" ? "Payment not verified yet" : undefined}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <next.Icon className="size-4" />}
            {next.label}
          </button>
        )}
      </div>
      {prepaidPending && status === "placed" && (
        <p className="text-xs font-medium text-amber-700">Tip: verify the wallet payment before confirming.</p>
      )}
      {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}

      <ShipDialog open={dialog === "ship"} onClose={close} code={code} courier={courier} />
      <ReasonDialog
        open={dialog === "cancel"}
        onClose={close}
        title="Cancel this order?"
        description="The customer will see it as cancelled on the tracking page. Prepaid orders are marked for refund."
        reasons={CANCEL_REASONS}
        confirmLabel="Cancel order"
        onConfirm={(reason) => updateOrderStatusAction(code, "cancelled", reason)}
      />
      <ReasonDialog
        open={dialog === "return"}
        onClose={close}
        title="Mark as returned?"
        description="Use this when the parcel comes back from the courier."
        reasons={RETURN_REASONS}
        confirmLabel="Mark returned"
        onConfirm={(reason) => updateOrderStatusAction(code, "returned", reason)}
      />
    </div>
  );
}

function ShipDialog({
  open,
  onClose,
  code,
  courier,
}: {
  open: boolean;
  onClose: () => void;
  code: string;
  courier?: { name: string; trackingNo: string };
}) {
  const { pending, error, run } = useAction();
  const [name, setName] = useState(courier?.name ?? "Steadfast");
  const [tracking, setTracking] = useState(courier?.trackingNo ?? "");
  return (
    <Dialog open={open} onClose={onClose} title="Hand over to courier" description="The tracking number is shown to the customer on the Track page.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const saved = await setCourierAction(code, name, tracking);
            if (!saved.ok) return saved;
            return updateOrderStatusAction(code, "shipped");
          }, onClose);
        }}
        className="space-y-4"
      >
        <CourierFields name={name} setName={setName} tracking={tracking} setTracking={setTracking} />
        {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}
        <button disabled={pending} className={abtn("accent", "w-full")}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <PackageOpen className="size-4" />} Mark as shipped
        </button>
      </form>
    </Dialog>
  );
}

function CourierFields({
  name,
  setName,
  tracking,
  setTracking,
}: {
  name: string;
  setName: (v: string) => void;
  tracking: string;
  setTracking: (v: string) => void;
}) {
  return (
    <>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink/60">Courier</span>
        <select value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm">
          {COURIERS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink/60">Tracking / consignment number</span>
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          required
          placeholder="e.g. SF12345678"
          className="h-11 w-full rounded-xl border border-ink/15 px-3 font-mono text-sm uppercase outline-none focus:border-ink"
        />
      </label>
    </>
  );
}

function ReasonDialog({
  open,
  onClose,
  title,
  description,
  reasons,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  reasons: string[];
  confirmLabel: string;
  onConfirm: (reason: string) => Promise<ActionResult>;
}) {
  const { pending, error, run } = useAction();
  const [reason, setReason] = useState(reasons[0]);
  const [custom, setCustom] = useState("");
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="space-y-2">
        {[...reasons, "Other"].map((r) => (
          <label
            key={r}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm",
              reason === r ? "border-ink bg-paper" : "border-ink/10 hover:border-ink/30",
            )}
          >
            <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-ink" />
            {r}
          </label>
        ))}
        {reason === "Other" && (
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Write the reason"
            className="h-11 w-full rounded-xl border border-ink/15 px-3 text-sm outline-none focus:border-ink"
            autoFocus
          />
        )}
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-rose-700">{error}</p>}
      <div className="mt-5 flex gap-2">
        <button onClick={onClose} className={abtn("outline", "flex-1")}>
          Keep order
        </button>
        <button
          disabled={pending || (reason === "Other" && !custom.trim())}
          onClick={() => run(() => onConfirm(reason === "Other" ? custom : reason), onClose)}
          className={cn(abtn("primary", "flex-1"), "bg-rose-600 hover:bg-rose-700")}
        >
          {pending && <Loader2 className="size-4 animate-spin" />} {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

export function PaymentReview({
  code,
  method,
  total,
  sender,
  trxId,
  canVerify,
  wallet,
}: {
  code: string;
  method: PaymentMethod;
  total: number;
  sender?: string;
  trxId?: string;
  canVerify: boolean;
  wallet: string;
}) {
  const { pending, error, run } = useAction();
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm">
      <p className="font-semibold text-amber-900">Check before confirming</p>
      <p className="mt-1 text-amber-900/80">
        Open the {PAYMENT_LABEL[method]} app for {wallet} and look for <b className="font-mono">{trxId}</b> of{" "}
        <b>{formatBDT(total)}</b> from <b>{sender}</b>.
      </p>
      {canVerify ? (
        <div className="mt-3 flex gap-2">
          <button disabled={pending} onClick={() => run(() => verifyPaymentAction(code, true))} className={abtn("primary", "h-9 flex-1 bg-emerald-700 hover:bg-emerald-800")}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Payment received
          </button>
          <button disabled={pending} onClick={() => run(() => verifyPaymentAction(code, false))} className={abtn("danger", "h-9")}>
            <X className="size-4" /> Not found
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-amber-900/70">Only an owner or manager can verify payments.</p>
      )}
      {error && <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p>}
    </div>
  );
}

export function CourierEditor({ code, courier }: { code: string; courier?: { name: string; trackingNo: string } }) {
  const { pending, error, run } = useAction();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(courier?.name ?? "Steadfast");
  const [tracking, setTracking] = useState(courier?.trackingNo ?? "");

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-xs font-semibold text-ink/60 underline-offset-2 hover:text-ink hover:underline">
        {courier ? "Edit courier" : "Add courier & tracking"}
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => setCourierAction(code, name, tracking), () => setEditing(false));
      }}
      className="mt-2 space-y-3 rounded-xl bg-paper p-3"
    >
      <CourierFields name={name} setName={setName} tracking={tracking} setTracking={setTracking} />
      {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setEditing(false)} className={abtn("ghost")}>
          Cancel
        </button>
        <button disabled={pending} className={abtn("primary", "h-9 flex-1")}>
          {pending && <Loader2 className="size-4 animate-spin" />} Save
        </button>
      </div>
    </form>
  );
}

export function NoteForm({ code }: { code: string }) {
  const { pending, error, run } = useAction();
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => addNoteAction(code, text), () => setText(""));
      }}
      className="mb-5"
    >
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an internal note (customers never see these)…"
          className="h-10 min-w-0 flex-1 rounded-xl border border-ink/15 px-3 text-sm outline-none focus:border-ink"
          aria-label="Internal note"
        />
        <button disabled={pending || !text.trim()} className={abtn("primary")}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Add"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-sm font-semibold text-rose-700">{error}</p>}
    </form>
  );
}
