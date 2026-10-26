import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-3xl font-black text-ink">Join as a mentee</h1>
      <p className="mt-2 text-sm text-ink/60">Create your account, then fill in your profile for your mentor.</p>
      <RegisterForm />
    </div>
  );
}
