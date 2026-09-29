"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound, Loader2, Pencil, Plus, Shuffle } from "lucide-react";
import { MIN_PASSWORD, ROLE_HINT, ROLE_LABEL, ROLES, type AdminRole } from "@emrix/shared/admin";
import { timeAgo } from "@emrix/shared/time";
import { cn } from "@emrix/shared/utils";
import { createStaffAction, resetStaffPasswordAction, updateStaffAction } from "@/actions/staff";
import { Dialog } from "../dialog";
import { Field, inputCls } from "../form";
import { abtn } from "../ui";

export interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

/** Readable random password for handing to a new team member. */
function generatePassword() {
  const words = (
    "ramen sakura ninja kaze tora kumo hoshi yama sora umi kitsune ryu neko inu hana tsuki " +
    "yuki ame hikari kage honoo mizu tsuchi kaminari mori kawa shiro kuro aka ao midori kin"
  ).split(" ");
  const rand = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  return `${words[rand(32)]}-${words[rand(32)]}-${words[rand(32)]}-${words[rand(32)]}-${100 + rand(900)}`;
}

type DialogState = { kind: "add" } | { kind: "edit"; row: StaffRow } | { kind: "password"; row: StaffRow } | null;

export function StaffManager({ rows, meId }: { rows: StaffRow[]; meId: string }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const close = () => setDialog(null);
  return (
    <>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setDialog({ kind: "add" })} className={abtn("accent")}>
          <Plus className="size-4" /> Add team member
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <ul className="divide-y divide-ink/[0.06]">
          {rows.map((r) => (
            <li key={r.id} className={cn("flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5", !r.active && "bg-paper/50")}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-full font-display text-xs", r.active ? "bg-kin text-ink" : "bg-ink/10 text-ink/40")}>
                  {r.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    <span className="truncate">{r.name}</span>
                    {r.id === meId && <span className="rounded bg-ink/[0.06] px-1.5 text-[10px] font-bold uppercase tracking-wide text-ink/55">You</span>}
                    {!r.active && <span className="rounded bg-rose-50 px-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">Deactivated</span>}
                  </p>
                  <p className="truncate text-sm text-ink/55">{r.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold">{ROLE_LABEL[r.role]}</p>
                  <p className="text-xs text-ink/50">{r.lastLoginAt ? `Last signed in ${timeAgo(r.lastLoginAt)}` : "Never signed in"}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setDialog({ kind: "edit", row: r })} className={abtn("ghost")} aria-label={`Edit ${r.name}`} title="Edit">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => setDialog({ kind: "password", row: r })} className={abtn("ghost")} aria-label={`Reset password for ${r.name}`} title="Reset password">
                    <KeyRound className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ROLES.map((role) => (
          <div key={role} className="rounded-2xl border border-ink/10 bg-white p-4">
            <p className="text-sm font-bold">{ROLE_LABEL[role]}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">{ROLE_HINT[role]}</p>
          </div>
        ))}
      </div>

      {dialog?.kind === "add" && <AddDialog onClose={close} />}
      {dialog?.kind === "edit" && <EditDialog row={dialog.row} self={dialog.row.id === meId} onClose={close} />}
      {dialog?.kind === "password" && <PasswordDialog row={dialog.row} onClose={close} />}
    </>
  );
}

function useSubmit(onDone: () => void) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const submit = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    start(async () => {
      setError("");
      const res = await fn();
      if (res.ok) {
        router.refresh();
        onDone();
      } else setError(res.error);
    });
  return { pending, error, submit };
}

function RolePicker({ value, onChange, disabled }: { value: AdminRole; onChange: (r: AdminRole) => void; disabled?: boolean }) {
  return (
    <div className="grid gap-2" role="radiogroup" aria-label="Role">
      {ROLES.map((role) => (
        <label
          key={role}
          className={cn(
            "flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5",
            value === role ? "border-ink bg-paper" : "border-ink/10 hover:border-ink/30",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <input type="radio" name="role" checked={value === role} onChange={() => onChange(role)} disabled={disabled} className="mt-1 accent-shu" />
          <span>
            <span className="block text-sm font-semibold">{ROLE_LABEL[role]}</span>
            <span className="block text-xs text-ink/55">{ROLE_HINT[role]}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      <input className={cn(inputCls, "font-mono")} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="new-password" minLength={MIN_PASSWORD} />
      <button type="button" onClick={() => onChange(generatePassword())} className={abtn("outline", "shrink-0 px-3")} title="Generate a password">
        <Shuffle className="size-4" /> Generate
      </button>
    </div>
  );
}

function AddDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", role: "staff" as AdminRole, password: generatePassword() });
  const { pending, error, submit } = useSubmit(onClose);
  return (
    <Dialog open onClose={onClose} title="Add team member" description="They sign in at /admin with this email and password. Share it privately (not in a group chat).">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(() => createStaffAction(form));
        }}
        className="space-y-4"
      >
        <Field label="Name">
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <RolePicker value={form.role} onChange={(role) => setForm({ ...form, role })} />
        <Field label="Password" hint={`At least ${MIN_PASSWORD} characters. They can change it later under Account.`}>
          <PasswordInput value={form.password} onChange={(password) => setForm({ ...form, password })} />
        </Field>
        {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}
        <button disabled={pending} className={abtn("accent", "w-full")}>
          {pending && <Loader2 className="size-4 animate-spin" />} Create account
        </button>
      </form>
    </Dialog>
  );
}

function EditDialog({ row, self, onClose }: { row: StaffRow; self: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: row.name, email: row.email, role: row.role, active: row.active });
  const { pending, error, submit } = useSubmit(onClose);
  return (
    <Dialog open onClose={onClose} title={`Edit ${row.name}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(() => updateStaffAction(row.id, form));
        }}
        className="space-y-4"
      >
        <Field label="Name">
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <RolePicker value={form.role} onChange={(role) => setForm({ ...form, role })} disabled={self} />
        <label className={cn("flex items-start gap-3 rounded-xl border border-ink/10 px-3 py-2.5", self && "opacity-50")}>
          <input
            type="checkbox"
            checked={form.active}
            disabled={self}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="mt-1 accent-shu"
          />
          <span>
            <span className="block text-sm font-semibold">Can sign in</span>
            <span className="block text-xs text-ink/55">Untick when someone leaves. They&apos;re signed out at once; their history stays.</span>
          </span>
        </label>
        {self && <p className="text-xs text-ink/55">You can&apos;t change your own role or deactivate yourself.</p>}
        {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}
        <button disabled={pending} className={abtn("accent", "w-full")}>
          {pending && <Loader2 className="size-4 animate-spin" />} Save
        </button>
      </form>
    </Dialog>
  );
}

function PasswordDialog({ row, onClose }: { row: StaffRow; onClose: () => void }) {
  const [password, setPassword] = useState(generatePassword());
  const { pending, error, submit } = useSubmit(onClose);
  return (
    <Dialog open onClose={onClose} title={`New password for ${row.name}`} description="They're signed out everywhere and sign in again with this password.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(() => resetStaffPasswordAction(row.id, password));
        }}
        className="space-y-4"
      >
        <Field label="New password" hint="Copy it before saving, then share it privately.">
          <PasswordInput value={password} onChange={setPassword} />
        </Field>
        {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}
        <button disabled={pending} className={abtn("accent", "w-full")}>
          {pending && <Loader2 className="size-4 animate-spin" />} Set password
        </button>
      </form>
    </Dialog>
  );
}
