import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-3xl font-black text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-ink/60">Sign in with your college account to continue.</p>
      <LoginForm />
    </div>
  );
}
