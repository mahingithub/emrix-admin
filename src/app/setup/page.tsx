import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Logo } from "@emrix/shared/ui/logo";
import { RecoverOwnerForm, SetupOwnerForm } from "@/components/setup-forms";
import { MIN_SETUP_KEY } from "@emrix/shared/api";
import { getSetupStatus } from "@/lib/backend";
import { shopUrl } from "@/lib/shop";

export const metadata: Metadata = { title: "Set up" };

export default async function SetupPage() {
  await connection(); // always check the live database and environment, never a build-time snapshot
  const status = await getSetupStatus();
  const firstRun = !status.hasAdmin;
  const key = status.setupKey;

  return (
    <div className="flex min-h-screen flex-col px-5 py-8 sm:px-10">
      <div className="flex items-center justify-between">
        <Link href={shopUrl()}>
          <Logo />
        </Link>
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
          <ArrowLeft className="size-4" /> Sign in
        </Link>
      </div>

      <div className="mx-auto my-auto w-full max-w-sm py-10">
        <p className="font-jp text-xs font-bold tracking-[0.3em] text-shu">{firstRun ? "はじめまして" : "復旧"}</p>
        <h1 className="mt-1 font-display text-3xl uppercase">{firstRun ? "Create the owner" : "Owner recovery"}</h1>
        <p className="mt-2 text-sm text-ink/60">
          {firstRun
            ? "The database is connected and empty. Create the first account: the owner, who can then add the rest of the team."
            : "Locked out of the owner account? Set a new password with the setup key. Everyone else can ask an owner to reset theirs in Staff."}
        </p>

        <div className="mt-8">
          {key === "ok" ? (
            firstRun ? (
              <SetupOwnerForm />
            ) : (
              <RecoverOwnerForm />
            )
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-bold">
                <KeyRound className="size-4" /> {key === "missing" ? "Setup key not set" : "Setup key too short"}
              </p>
              <p className="mt-1.5 leading-relaxed">
                Add <code className="rounded bg-white/70 px-1 font-mono">ADMIN_SETUP_KEY</code> to the backend&apos;s environment
                variables (at least {MIN_SETUP_KEY} characters, like a long random password), restart or redeploy, then reload
                this page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
