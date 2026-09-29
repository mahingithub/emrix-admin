"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@emrix/shared/utils";
import { abtn, type adminBtn } from "./ui";

type Result = { ok: true; message?: string } | { ok: false; error: string };

/** Button that runs a server action, then shows its message (or error) underneath. */
export function ActionButton({
  action,
  children,
  confirm: confirmText,
  variant = "outline",
  className,
  align = "start",
}: {
  action: () => Promise<Result>;
  children: ReactNode;
  confirm?: string;
  variant?: Exclude<keyof typeof adminBtn, "base">;
  className?: string;
  align?: "start" | "end";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  return (
    <div className={cn("flex flex-col gap-1.5", align === "end" ? "items-end" : "items-start")}>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          start(async () => {
            const res = await action();
            setResult(res);
            if (res.ok) router.refresh();
          });
        }}
        className={abtn(variant, className)}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
      {result && (
        <p className={cn("max-w-sm text-xs font-semibold", result.ok ? "text-emerald-700" : "text-rose-700")} role="status">
          {result.ok ? (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> {result.message ?? "Done."}
            </span>
          ) : (
            result.error
          )}
        </p>
      )}
    </div>
  );
}
