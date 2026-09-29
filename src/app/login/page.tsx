import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@emrix/shared/ui/logo";
import { LoginForm } from "@/components/login-form";
import { getCurrentAdmin } from "@/lib/auth";
import { getSetupStatus } from "@/lib/backend";
import { shopUrl } from "@/lib/shop";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : undefined;
  if (await getCurrentAdmin()) redirect(nextPath ?? "/");
  // A fresh database has no accounts yet: create the owner first.
  if (!(await getSetupStatus()).hasAdmin) redirect("/setup");

  return (
    <div className="grid grid-cols-1 min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col">
        <div className="speedlines absolute inset-0 [--line-color:rgb(255_255_255/0.04)]" />
        <div className="absolute -bottom-24 -right-24 size-[28rem] rounded-full bg-shu" />
        <span aria-hidden className="absolute -bottom-10 right-10 select-none font-display text-[16rem] leading-none text-ink">
          管
        </span>
        <Link href={shopUrl()} className="relative">
          <Logo invert />
        </Link>
        <div className="relative mt-auto max-w-md">
          <p className="font-jp text-sm font-bold tracking-[0.4em] text-kin">管理コンソール</p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[0.95]">
            Run the
            <br />
            dojo.
          </h1>
          <p className="mt-4 text-paper/65">
            Orders, payments, deliveries and sales for the EMRIX store, from your laptop or your phone.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href={shopUrl()} className="lg:hidden">
            <Logo />
          </Link>
          <Link href={shopUrl()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
            <ArrowLeft className="size-4" /> Back to store
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-sm py-10">
          <p className="font-jp text-xs font-bold tracking-[0.3em] text-shu">ようこそ</p>
          <h2 className="mt-1 font-display text-3xl uppercase">Admin sign in</h2>
          <p className="mt-2 text-sm text-ink/60">Welcome back. Sign in to manage the store.</p>

          <div className="mt-8">
            <LoginForm next={nextPath} />
          </div>
          <p className="mt-6 text-center text-xs text-ink/50">
            Forgot your password? Ask the shop owner to reset it in Staff.{" "}
            <Link href="/setup" className="font-semibold underline underline-offset-2 hover:text-ink">
              Owner recovery
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
