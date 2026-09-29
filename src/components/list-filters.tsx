"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@emrix/shared/utils";

export interface FilterSelect {
  key: string;
  label: string;
  aria: string;
  options: readonly (readonly [string, string])[];
}

/** URL-driven search + select filters for admin lists. No `placeholder` = no search box. `keep` params survive "Clear filters". */
export function ListFilters({ selects, placeholder, keep = [] }: { selects: FilterSelect[]; placeholder?: string; keep?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const push = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => push({ q: q.trim() || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [q]);

  const active = selects.some((s) => params.get(s.key)) || !!params.get("q");

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {placeholder !== undefined && (
        <label className="flex h-10 items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 focus-within:border-ink/40 sm:w-72">
          <Search className="size-4 shrink-0 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
            aria-label="Search"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-ink/40 hover:text-ink" aria-label="Clear search">
              <X className="size-4" />
            </button>
          )}
        </label>
      )}
      <div className={cn("grid gap-2 sm:flex", selects.length === 3 ? "grid-cols-3" : selects.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
        {selects.map((s) => (
          <select
            key={s.key}
            value={params.get(s.key) ?? ""}
            onChange={(e) => push({ [s.key]: e.target.value || null })}
            aria-label={s.aria}
            className={cn(
              "h-10 min-w-0 rounded-xl border bg-white px-2.5 text-sm outline-none focus:border-ink/40",
              params.get(s.key) ? "border-ink/40 font-semibold" : "border-ink/10 text-ink/70",
            )}
          >
            <option value="">{s.label}</option>
            {s.options.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ))}
      </div>
      {active && (
        <button
          onClick={() => {
            setQ("");
            const next = new URLSearchParams();
            for (const k of keep) {
              const v = params.get(k);
              if (v) next.set(k, v);
            }
            const qs = next.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
          }}
          className="h-10 rounded-xl px-3 text-sm font-semibold text-ink/60 hover:bg-ink/5 hover:text-ink"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
