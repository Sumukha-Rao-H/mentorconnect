"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword, updateAccount } from "@/app/actions/admin";
import { FormMessage, SubmitButton } from "@/components/forms";

export function AccountForm({ name, phone }: { name: string; phone: string }) {
  const [state, action] = useActionState(updateAccount, undefined);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="acc-name" className="label">Display name</label>
        <input id="acc-name" name="name" defaultValue={name} required className="input" />
      </div>
      <div>
        <label htmlFor="acc-phone" className="label">Phone</label>
        <input id="acc-phone" name="phone" type="tel" defaultValue={phone} className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton>Save</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <div>
        <label htmlFor="pw-current" className="label">Current password</label>
        <input id="pw-current" name="current" type="password" autoComplete="current-password" required className="input" />
      </div>
      <div>
        <label htmlFor="pw-next" className="label">New password</label>
        <input id="pw-next" name="next" type="password" minLength={8} autoComplete="new-password" required className="input" />
      </div>
      <div>
        <label htmlFor="pw-confirm" className="label">Confirm new password</label>
        <input id="pw-confirm" name="confirm" type="password" minLength={8} autoComplete="new-password" required className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-navy" pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}
