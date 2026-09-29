"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@emrix/shared/utils";

export const inputCls =
  "h-10 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none transition-colors placeholder:text-ink/35 focus:border-ink";

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold text-ink/65">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/45">{hint}</span>}
    </label>
  );
}

export type Notice = { ok: boolean; text: string } | null;

export function NoticeBar({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  if (!notice) return null;
  return (
    <div
      className={cn(
        "mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold",
        notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700",
      )}
      role={notice.ok ? "status" : "alert"}
    >
      {notice.text}
      <button type="button" onClick={onClose} aria-label="Dismiss">
        <X className="size-4" />
      </button>
    </div>
  );
}

/** Whole-taka number input value → number, or undefined when empty. */
export const numOrUndef = (v: string) => (v.trim() === "" ? undefined : Math.round(Number(v)));
