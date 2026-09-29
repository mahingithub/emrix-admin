"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { SIZES } from "@emrix/shared/catalog";
import type { Size, TeeColor } from "@emrix/shared/types";
import { cn } from "@emrix/shared/utils";
import { setStockAction } from "@/actions/catalog";

type Reason = "restock" | "damaged" | "correction";
const ReasonContext = createContext<{ reason: Reason; setReason: (r: Reason) => void }>({ reason: "restock", setReason: () => {} });

/** Wraps the inventory page so every cell logs changes with the chosen reason. */
export function InventoryControls({ children }: { children: ReactNode }) {
  const [reason, setReason] = useState<Reason>("restock");
  return <ReasonContext.Provider value={{ reason, setReason }}>{children}</ReasonContext.Provider>;
}

export function ReasonPicker() {
  const { reason, setReason } = useContext(ReasonContext);
  const options: { value: Reason; label: string }[] = [
    { value: "restock", label: "Restock" },
    { value: "damaged", label: "Damaged / lost" },
    { value: "correction", label: "Count correction" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold text-ink/60">Log changes as</span>
      <div className="inline-flex rounded-xl border border-ink/10 bg-white p-1" role="radiogroup" aria-label="Reason for stock changes">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={reason === o.value}
            onClick={() => setReason(o.value)}
            className={cn("rounded-lg px-3 py-1.5 font-semibold", reason === o.value ? "bg-ink text-paper" : "text-ink/60 hover:text-ink")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StockGrid({
  productId,
  colors,
  stock,
  lowAt,
  canEdit,
}: {
  productId: string;
  colors: TeeColor[];
  stock: Record<string, Partial<Record<Size, number>>>;
  lowAt: number;
  canEdit: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="text-xs text-ink/50">
            <th className="pb-1.5 text-left font-semibold">Colour</th>
            {SIZES.map((s) => (
              <th key={s} className="w-16 pb-1.5 text-center font-semibold">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {colors.map((c) => (
            <tr key={c.name}>
              <td className="py-1 pr-2">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span className="size-3.5 rounded-full border border-ink/20" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </span>
              </td>
              {SIZES.map((s) => (
                <td key={s} className="px-1 py-1">
                  <Cell productId={productId} color={c.name} size={s} value={stock[c.name]?.[s] ?? 0} lowAt={lowAt} canEdit={canEdit} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({
  productId,
  color,
  size,
  value,
  lowAt,
  canEdit,
}: {
  productId: string;
  color: string;
  size: Size;
  value: number;
  lowAt: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const { reason } = useContext(ReasonContext);
  const [draft, setDraft] = useState(String(value));
  const [pending, start] = useTransition();
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const shown = Number(draft);

  const commit = () => {
    const n = Math.max(0, Math.round(Number(draft) || 0));
    if (n === value) {
      setDraft(String(value));
      return;
    }
    start(async () => {
      const res = await setStockAction(productId, color, size, n, reason);
      if (res.ok) {
        setState("saved");
        setDraft(String(res.data ?? n));
        router.refresh();
        setTimeout(() => setState("idle"), 1500);
      } else {
        setState("error");
        setError(res.error);
        setDraft(String(value));
      }
    });
  };

  if (!canEdit) {
    return (
      <span
        className={cn(
          "block rounded-lg py-1.5 text-center tabular-nums",
          value === 0 ? "bg-rose-50 text-rose-700" : value <= lowAt ? "bg-amber-50 text-amber-800" : "bg-paper",
        )}
      >
        {value}
      </span>
    );
  }
  return (
    <span className="relative block" title={state === "error" ? error : undefined}>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setDraft(String(value));
        }}
        aria-label={`${color} ${size} stock`}
        className={cn(
          "h-8 w-full rounded-lg border px-1 text-center tabular-nums outline-none transition-colors focus:border-ink",
          state === "error" && "border-rose-400",
          shown === 0 ? "border-rose-200 bg-rose-50 text-rose-700" : shown <= lowAt ? "border-amber-200 bg-amber-50 text-amber-800" : "border-ink/10 bg-white",
        )}
      />
      {(pending || state === "saved") && (
        <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-ink text-paper">
          {pending ? <Loader2 className="size-2.5 animate-spin" /> : <Check className="size-2.5" />}
        </span>
      )}
    </span>
  );
}
