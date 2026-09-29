import { cn } from "../src/utils";

/** The EMRIX wordmark, used by the shop, the admin panel and invoices. */
export function Logo({ invert, className }: { invert?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", invert && "text-washi", className)}>
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg border-2 bg-shu font-jp text-lg font-black text-white",
          invert ? "border-washi shadow-[2px_2px_0_0_var(--color-washi)]" : "border-ink shadow-[2px_2px_0_0_var(--color-ink)]",
        )}
        aria-hidden
      >
        絵
      </span>
      <span className="leading-none">
        <span className="block font-display text-xl tracking-tight">EMRIX</span>
        <span
          className={cn(
            "mt-0.5 block font-jp text-[8.5px] font-bold tracking-[0.42em]",
            invert ? "text-washi/60" : "text-ink/55",
          )}
        >
          エムリックス
        </span>
      </span>
    </span>
  );
}
