"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { MIN_PASSWORD } from "@emrix/shared/admin";
import { changeOwnPasswordAction, renameSelfAction } from "@/actions/staff";
import { Card, abtn } from "../ui";
import { Field, inputCls, NoticeBar, type Notice } from "../form";

export function AccountForms({ name }: { name: string }) {
  const router = useRouter();
  const [newName, setNewName] = useState(name);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [notice, setNotice] = useState<Notice>(null);
  const [savingName, startName] = useTransition();
  const [savingPw, startPw] = useTransition();

  return (
    <>
      <NoticeBar notice={notice} onClose={() => setNotice(null)} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Your name">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startName(async () => {
                const res = await renameSelfAction(newName);
                setNotice(res.ok ? { ok: true, text: res.message ?? "Saved." } : { ok: false, text: res.error });
                if (res.ok) router.refresh();
              });
            }}
            className="space-y-4"
          >
            <Field label="Name" hint="Shown on orders and in the activity log.">
              <input className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} required autoComplete="name" />
            </Field>
            <button disabled={savingName || newName.trim() === name} className={abtn("primary")}>
              {savingName && <Loader2 className="size-4 animate-spin" />} Save name
            </button>
          </form>
        </Card>

        <Card title="Change password">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pw.next !== pw.confirm) {
                setNotice({ ok: false, text: "The new passwords don't match." });
                return;
              }
              startPw(async () => {
                const res = await changeOwnPasswordAction(pw.current, pw.next);
                setNotice(res.ok ? { ok: true, text: res.message ?? "Saved." } : { ok: false, text: res.error });
                if (res.ok) setPw({ current: "", next: "", confirm: "" });
              });
            }}
            className="space-y-4"
          >
            <Field label="Current password">
              <input className={inputCls} type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required autoComplete="current-password" />
            </Field>
            <Field label="New password" hint={`At least ${MIN_PASSWORD} characters.`}>
              <input className={inputCls} type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required minLength={MIN_PASSWORD} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <input className={inputCls} type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required autoComplete="new-password" />
            </Field>
            <button disabled={savingPw} className={abtn("primary")}>
              {savingPw && <Loader2 className="size-4 animate-spin" />} Change password
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}
