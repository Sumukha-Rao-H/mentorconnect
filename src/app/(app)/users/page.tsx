import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { changeRole, toggleActive } from "@/app/actions/admin";
import { ConfirmButton, SubmitButton } from "@/components/forms";
import { Avatar, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { roleEnum, users } from "@/db/schema";
import { requireRole } from "@/lib/dal";
import { formatDate } from "@/lib/profile";
import { ROLE_LABEL } from "@/lib/rbac";
import { CreateUserForm } from "./create-user-form";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireRole("admin");
  const all = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.role), asc(users.name));

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <PageHeader title="Users & roles" subtitle={`${all.length} accounts. Role changes apply on the user's next request.`} />
        <ul data-tour="users-list" className="space-y-3">
          {all.map((u) => (
            <li key={u.id} className={`card flex flex-col gap-3 p-4 lg:flex-row lg:items-center ${u.active ? "" : "opacity-60"}`}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={u.name} size={38} />
                <div className="min-w-0">
                  <div className="truncate font-bold text-ink">
                    {u.name} {u.id === me.id && <span className="text-xs font-normal text-ink/50">(you)</span>}
                    {!u.active && <span className="ml-2 rounded bg-ink px-1.5 py-0.5 text-[10px] text-white">Deactivated</span>}
                  </div>
                  <div className="truncate text-xs text-ink/55">{u.email} · joined {formatDate(u.createdAt)}</div>
                </div>
              </div>
              {u.id === me.id ? (
                <span className="text-sm font-bold text-navy">{ROLE_LABEL[u.role]}</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <form action={changeRole.bind(null, u.id)} className="flex gap-2">
                    <select name="role" defaultValue={u.role} aria-label={`Role for ${u.name}`} className="input py-1.5">
                      {roleEnum.enumValues.map((r) => (
                        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                      ))}
                    </select>
                    <SubmitButton className="btn-navy px-4 py-1.5 text-xs" pendingText="…">Save</SubmitButton>
                  </form>
                  <form action={toggleActive.bind(null, u.id)}>
                    <ConfirmButton
                      message={u.active ? `Deactivate ${u.name}? They will be signed out.` : `Reactivate ${u.name}?`}
                      className="btn-outline px-4 py-1.5 text-xs"
                    >
                      {u.active ? "Deactivate" : "Activate"}
                    </ConfirmButton>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <aside>
        <div data-tour="create-user" className="card p-5 xl:sticky xl:top-6">
          <h2 className="section-title mb-4">Create account</h2>
          <CreateUserForm />
        </div>
      </aside>
    </div>
  );
}
