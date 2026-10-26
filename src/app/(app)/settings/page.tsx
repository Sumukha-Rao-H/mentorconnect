import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { ROLE_LABEL } from "@/lib/rbac";
import { AccountForm, PasswordForm } from "./settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" subtitle={`${user.email} · ${ROLE_LABEL[user.role]} · ${user.department}`} />
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="section-title mb-4">Account</h2>
          <AccountForm name={user.name} phone={user.phone ?? ""} />
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="section-title mb-4">Change password</h2>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
