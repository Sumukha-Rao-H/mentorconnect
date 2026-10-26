"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/forms";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" defaultValue={state?.fields?.email} />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Signing in…">Sign in</SubmitButton>
      <p className="text-center text-sm text-ink/60">
        New mentee?{" "}
        <Link href="/register" className="font-bold text-teal hover:underline">Create your account</Link>
      </p>
      <p className="rounded-xl bg-canvas px-4 py-3 text-xs text-ink/60">
        Mentor, admin and HOD accounts are created by the department administrator. Demo accounts are listed in the README.
      </p>
    </form>
  );
}
