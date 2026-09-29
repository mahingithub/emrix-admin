import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { PAYMENT_STATUS_LABEL, STATUS_LABEL, type OrderStatus, type PaymentStatus } from "@emrix/shared/orders";
import { cn } from "@emrix/shared/utils";

const STATUS_TONE: Record<OrderStatus, string> = {
  placed: "bg-kin/35 text-ink ring-kin",
  confirmed: "bg-sky-50 text-sky-800 ring-sky-200",
  printing: "bg-violet-50 text-violet-800 ring-violet-200",
  shipped: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  returned: "bg-rose-50 text-rose-700 ring-rose-200",
};

const STATUS_DOT: Record<OrderStatus, string> = {
  placed: "bg-shu",
  confirmed: "bg-sky-500",
  printing: "bg-violet-500",
  shipped: "bg-indigo-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-zinc-400",
  returned: "bg-rose-500",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        STATUS_TONE[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}

const PAY_TONE: Record<PaymentStatus, string> = {
  unpaid: "text-zinc-600",
  pending: "text-amber-700",
  paid: "text-emerald-700",
  failed: "text-rose-700",
  refunded: "text-slate-600",
};

const PAY_DOT: Record<PaymentStatus, string> = {
  unpaid: "border border-zinc-400 bg-transparent",
  pending: "bg-amber-500",
  paid: "bg-emerald-500",
  failed: "bg-rose-500",
  refunded: "bg-slate-400",
};

export function PaymentBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold", PAY_TONE[status], className)}>
      <span className={cn("size-1.5 rounded-full", PAY_DOT[status])} />
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: "new" | "trusted" | "watch" | "high" }) {
  const map = {
    new: { label: "New customer", Icon: Sparkles, cls: "bg-sky-50 text-sky-800 ring-sky-200" },
    trusted: { label: "Trusted buyer", Icon: ShieldCheck, cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
    watch: { label: "Watch: past failed order", Icon: ShieldAlert, cls: "bg-amber-50 text-amber-800 ring-amber-200" },
    high: { label: "High risk: repeat cancels/returns", Icon: ShieldAlert, cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  }[risk];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", map.cls)}>
      <map.Icon className="size-3.5" />
      {map.label}
    </span>
  );
}

export function Card({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-ink/10 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)]", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-ink/[0.07] px-5 py-3.5">
          <h2 className="text-sm font-bold">{title}</h2>
          {action}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  jp,
  description,
  actions,
  children,
}: {
  title: string;
  jp?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {jp && <p className="font-jp text-[11px] font-bold tracking-[0.3em] text-shu">{jp}</p>}
        <h1 className="mt-0.5 font-display text-2xl uppercase leading-none sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-ink/60">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Stat tile: label · value · delta vs previous period. */
export function StatTile({
  label,
  value,
  delta,
  deltaLabel,
  deltaUnit = "%",
  upIsGood = true,
  hint,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  deltaUnit?: string;
  upIsGood?: boolean;
  hint?: string;
}) {
  const hasDelta = delta !== null && delta !== undefined && Number.isFinite(delta);
  const up = hasDelta && delta! > 0;
  const flat = hasDelta && Math.abs(delta!) < 0.5;
  const good = flat ? null : up === upIsGood;
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-5">
      <p className="text-xs font-semibold text-ink/55">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight sm:text-[1.75rem]">{value}</p>
      <div className="mt-1.5 flex min-h-5 flex-wrap items-center gap-x-1.5 text-xs">
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold",
              good === null ? "text-ink/55" : good ? "text-[#006300]" : "text-[#b42318]",
            )}
          >
            {!flat && (up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />)}
            {flat ? "No change" : `${delta! > 0 ? "+" : ""}${delta!.toFixed(Math.abs(delta!) < 10 ? 1 : 0)}${deltaUnit}`}
          </span>
        )}
        {(deltaLabel || hint) && <span className="text-ink/45">{hasDelta ? deltaLabel : hint}</span>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-paper text-ink/40">{icon}</span>
      <p className="mt-4 font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-ink/55">{children}</div>}
    </div>
  );
}

export const adminBtn = {
  base: "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
  primary: "h-10 bg-ink px-4 text-paper hover:bg-ink/85",
  accent: "h-10 bg-shu px-4 text-white hover:bg-shu-dark",
  outline: "h-10 border border-ink/15 bg-white px-4 hover:border-ink/40 hover:bg-paper",
  ghost: "h-9 px-3 text-ink/70 hover:bg-ink/5 hover:text-ink",
  danger: "h-10 border border-rose-200 bg-white px-4 text-rose-700 hover:bg-rose-50",
};

export function abtn(variant: Exclude<keyof typeof adminBtn, "base">, className?: string) {
  return cn(adminBtn.base, adminBtn[variant], className);
}
