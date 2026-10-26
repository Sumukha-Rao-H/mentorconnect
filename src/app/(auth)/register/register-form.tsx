"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/forms";

export function RegisterForm() {
  const [state, action] = useActionState(register, undefined);
  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="label">Full name</label>
        <input id="name" name="name" required autoComplete="name" className="input" defaultValue={state?.fields?.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="usn" className="label">USN</label>
          <input id="usn" name="usn" required placeholder="4NM23IS041" className="input uppercase" defaultValue={state?.fields?.usn} />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" defaultValue={state?.fields?.email} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className="input" />
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirm</label>
          <input id="confirm" name="confirm" type="password" minLength={8} required autoComplete="new-password" className="input" />
        </div>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Creating account…">Create account</SubmitButton>
      <p className="text-center text-sm text-ink/60">
        Already registered?{" "}
        <Link href="/login" className="font-bold text-teal hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
