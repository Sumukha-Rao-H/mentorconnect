"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUser } from "@/app/actions/admin";
import { FormMessage, SubmitButton } from "@/components/forms";

export function CreateUserForm() {
  const [state, action] = useActionState(createUser, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div>
        <label htmlFor="cu-name" className="label">Name</label>
        <input id="cu-name" name="name" required className="input" />
      </div>
      <div>
        <label htmlFor="cu-email" className="label">Email</label>
        <input id="cu-email" name="email" type="email" required className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cu-role" className="label">Role</label>
          <select id="cu-role" name="role" defaultValue="mentor" className="input">
            <option value="mentor">Mentor</option>
            <option value="mentee">Mentee</option>
            <option value="admin">Administrator</option>
            <option value="hod">HOD</option>
          </select>
        </div>
        <div>
          <label htmlFor="cu-dept" className="label">Department</label>
          <input id="cu-dept" name="department" defaultValue="ISE" className="input" />
        </div>
      </div>
      <div>
        <label htmlFor="cu-password" className="label">Temporary password</label>
        <input id="cu-password" name="password" type="text" minLength={8} required autoComplete="off" className="input" />
        <p className="mt-1 text-[11px] text-ink/50">Share it privately; they can change it under Settings.</p>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Creating…">Create account</SubmitButton>
    </form>
  );
}
