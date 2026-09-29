"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../src/utils";

export function CopyButton({ value, label = "Copy", className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className={cn("grid place-items-center", className)}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
}
