"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { loginAction, type LoginState } from "@/actions/admin";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/70">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue={state.email}
          placeholder="you@emrix.com.bd"
          className="h-12 w-full rounded-xl border border-ink/15 bg-white px-3.5 text-[15px] outline-none placeholder:text-ink/35 focus:border-ink"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/70">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-12 w-full rounded-xl border border-ink/15 bg-white px-3.5 text-[15px] outline-none focus:border-ink"
        />
      </label>
      {state.error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <p className="flex items-center justify-center gap-1.5 text-xs text-ink/45">
        <Lock className="size-3" /> Staff access only
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-bold text-paper transition-colors hover:bg-ink/85 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <>Sign in <ArrowRight className="size-4" /></>}
    </button>
  );
}
