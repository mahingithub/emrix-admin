"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { MIN_PASSWORD } from "@emrix/shared/admin";
import { recoverOwnerAction, setupOwnerAction, type SetupState } from "@/actions/setup";

const input =
  "h-12 w-full rounded-xl border border-ink/15 bg-white px-3.5 text-[15px] outline-none placeholder:text-ink/35 focus:border-ink";
const label = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/70";

function Field({ name, title, hint, ...rest }: { name: string; title: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className={label}>{title}</span>
      <input name={name} className={input} {...rest} />
      {hint && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
    </label>
  );
}

function Passwords() {
  const [show, setShow] = useState(false);
  return (
    <>
      <label className="block">
        <span className={label}>Password</span>
        <span className="relative block">
          <input name="password" type={show ? "text" : "password"} required minLength={MIN_PASSWORD} autoComplete="new-password" className={`${input} pr-11`} />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink/45 hover:text-ink"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </span>
        <span className="mt-1 block text-xs text-ink/50">At least {MIN_PASSWORD} characters. A short sentence works well.</span>
      </label>
      <Field name="confirm" title="Confirm password" type={show ? "text" : "password"} required autoComplete="new-password" />
    </>
  );
}

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-bold text-paper transition-colors hover:bg-ink/85 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <>{children} <ArrowRight className="size-4" /></>}
    </button>
  );
}

function ErrorLine({ state }: { state: SetupState }) {
  return state.error ? (
    <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700" role="alert">
      {state.error}
    </p>
  ) : null;
}

const keyHint = "The ADMIN_SETUP_KEY value from the backend's environment settings.";

export function SetupOwnerForm() {
  const [state, action] = useActionState<SetupState, FormData>(setupOwnerAction, {});
  return (
    <form action={action} className="space-y-4">
      <Field name="key" title="Setup key" type="password" required autoComplete="off" hint={keyHint} />
      <Field name="name" title="Your name" required autoComplete="name" defaultValue={state.values?.name} placeholder="Full name" />
      <Field name="email" title="Email" type="email" required autoComplete="username" defaultValue={state.values?.email} placeholder="you@example.com" />
      <Passwords />
      <ErrorLine state={state} />
      <Submit>Create owner account</Submit>
    </form>
  );
}

export function RecoverOwnerForm() {
  const [state, action] = useActionState<SetupState, FormData>(recoverOwnerAction, {});
  return (
    <form action={action} className="space-y-4">
      <Field name="key" title="Setup key" type="password" required autoComplete="off" hint={keyHint} />
      <Field name="email" title="Owner email" type="email" required autoComplete="username" defaultValue={state.values?.email} />
      <Passwords />
      <ErrorLine state={state} />
      <Submit>Set new password</Submit>
    </form>
  );
}
