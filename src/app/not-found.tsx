import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@emrix/shared/ui/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-16 text-center">
      <Logo />
      <p className="mt-10 font-jp text-xs font-bold tracking-[0.3em] text-shu">見つかりません</p>
      <h1 className="mt-1 font-display text-3xl uppercase">Not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink/60">That order, product or page doesn&apos;t exist, or it was deleted.</p>
      <Link href="/" className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/85">
        <ArrowLeft className="size-4" /> Dashboard
      </Link>
    </div>
  );
}
