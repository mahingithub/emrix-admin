"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/85"
    >
      <Printer className="size-4" /> Print
    </button>
  );
}
