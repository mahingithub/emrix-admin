import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@emrix/shared/utils";
import { abtn } from "./ui";

/** Prev / next links for server-rendered admin lists. */
export function Pager({ page, pages, total, pageSize, href }: { page: number; pages: number; total: number; pageSize: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <p className="text-ink/55">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex gap-2">
        <Link href={href(page - 1)} aria-disabled={page <= 1} className={cn(abtn("outline", "h-9 px-3"), page <= 1 && "pointer-events-none opacity-40")}>
          <ChevronLeft className="size-4" /> Prev
        </Link>
        <Link href={href(page + 1)} aria-disabled={page >= pages} className={cn(abtn("outline", "h-9 px-3"), page >= pages && "pointer-events-none opacity-40")}>
          Next <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
