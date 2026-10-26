import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { auditLogs, menteeProfiles, users, type Role } from "@/db/schema";
import { can, canViewMentee, type Permission } from "./rbac";
import { readSession } from "./session";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  department: string;
  phone: string | null;
};

// The cookie only carries identity; role and active flag are re-read from the
// database once per request so a role change or deactivation applies at once.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session) return null;
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      department: users.department,
      phone: users.phone,
      active: users.active,
    })
    .from(users)
    .where(eq(users.id, session.userId));
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, phone: user.phone };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard?denied=1");
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user.role, permission)) throw new Error("You do not have permission to do that.");
  return user;
}

export async function assertCanViewMentee(user: CurrentUser, menteeId: number) {
  const [profile] = await db
    .select({ mentorId: menteeProfiles.mentorId })
    .from(menteeProfiles)
    .where(eq(menteeProfiles.userId, menteeId));
  if (!canViewMentee(user, menteeId, profile ?? null)) {
    throw new Error("You do not have access to this mentee.");
  }
  return profile ?? null;
}

export async function audit(actorId: number | null, action: string, details?: string) {
  await db.insert(auditLogs).values({ actorId, action, details });
}
