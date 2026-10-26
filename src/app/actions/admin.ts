"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { menteeProfiles, roleEnum, users } from "@/db/schema";
import { audit, requirePermission, requireUser } from "@/lib/dal";
import type { FormState } from "./auth";

async function describeMentee(id: number) {
  const [row] = await db
    .select({ name: users.name, usn: menteeProfiles.usn })
    .from(users)
    .leftJoin(menteeProfiles, eq(menteeProfiles.userId, users.id))
    .where(eq(users.id, id));
  return row ? `${row.name}${row.usn ? ` (${row.usn})` : ""}` : `#${id}`;
}

export async function endorseProfile(menteeId: number, formData: FormData) {
  const user = await requirePermission("profile:endorse");
  const remark = String(formData.get("remark") ?? "").trim() || null;
  await db
    .update(menteeProfiles)
    .set({ status: "endorsed", endorsedById: user.id, endorsedAt: new Date(), adminRemark: remark })
    .where(eq(menteeProfiles.userId, menteeId));
  await audit(user.id, "profile.endorsed", `Endorsed ${await describeMentee(menteeId)}`);
  revalidatePath("/", "layout");
}

export async function requestChanges(menteeId: number, formData: FormData) {
  const user = await requirePermission("profile:endorse");
  const remark = String(formData.get("remark") ?? "").trim();
  if (!remark) throw new Error("Tell the student what needs to change.");
  await db
    .update(menteeProfiles)
    .set({ status: "changes_requested", endorsedById: null, endorsedAt: null, adminRemark: remark })
    .where(eq(menteeProfiles.userId, menteeId));
  await audit(user.id, "profile.changes_requested", `Requested changes from ${await describeMentee(menteeId)}`);
  revalidatePath("/", "layout");
}

export async function assignMentor(menteeId: number, formData: FormData) {
  const user = await requirePermission("mentor:assign");
  const raw = String(formData.get("mentorId") ?? "");
  const mentorId = raw ? Number(raw) : null;
  if (mentorId) {
    const [mentor] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, mentorId), eq(users.role, "mentor")));
    if (!mentor) throw new Error("That user is not a mentor.");
  }
  await db
    .insert(menteeProfiles)
    .values({ userId: menteeId, mentorId })
    .onConflictDoUpdate({ target: menteeProfiles.userId, set: { mentorId } });
  await audit(
    user.id,
    "mentor.assigned",
    mentorId ? `Assigned mentor #${mentorId} to ${await describeMentee(menteeId)}` : `Unassigned mentor from ${await describeMentee(menteeId)}`,
  );
  revalidatePath("/", "layout");
}

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Enter a name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(roleEnum.enumValues),
  department: z.string().trim().min(2).default("ISE"),
  password: z.string().min(8, "Temporary password must be at least 8 characters"),
});

export async function createUser(_: FormState, formData: FormData): Promise<FormState> {
  const admin = await requirePermission("user:manage");
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const { password, ...rest } = parsed.data;
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, rest.email));
  if (exists) return { error: "That email is already in use." };

  const [created] = await db
    .insert(users)
    .values({ ...rest, passwordHash: await bcrypt.hash(password, 10) })
    .returning();
  if (created!.role === "mentee") await db.insert(menteeProfiles).values({ userId: created!.id });
  await audit(admin.id, "user.created", `Created ${rest.role} ${rest.name} <${rest.email}>`);
  revalidatePath("/users");
  return { ok: `${rest.name} can now sign in with the temporary password.` };
}

export async function changeRole(userId: number, formData: FormData) {
  const admin = await requirePermission("user:manage");
  if (userId === admin.id) throw new Error("You cannot change your own role.");
  const role = z.enum(roleEnum.enumValues).parse(formData.get("role"));
  await db.update(users).set({ role }).where(eq(users.id, userId));
  if (role === "mentee") {
    await db.insert(menteeProfiles).values({ userId }).onConflictDoNothing();
  } else {
    // A former mentor's mentees become unassigned rather than pointing at a non-mentor.
    await db.update(menteeProfiles).set({ mentorId: null }).where(eq(menteeProfiles.mentorId, userId));
  }
  await audit(admin.id, "user.role_changed", `User #${userId} is now ${role}`);
  revalidatePath("/users");
}

export async function toggleActive(userId: number) {
  const admin = await requirePermission("user:manage");
  if (userId === admin.id) throw new Error("You cannot deactivate yourself.");
  const [u] = await db.select({ active: users.active, name: users.name }).from(users).where(eq(users.id, userId));
  if (!u) return;
  await db.update(users).set({ active: !u.active }).where(eq(users.id, userId));
  await audit(admin.id, u.active ? "user.deactivated" : "user.activated", u.name);
  revalidatePath("/users");
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(8, "New password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { message: "New passwords do not match" });

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id));
  if (!row || !(await bcrypt.compare(parsed.data.current, row.hash))) {
    return { error: "Current password is incorrect." };
  }
  await db.update(users).set({ passwordHash: await bcrypt.hash(parsed.data.next, 10) }).where(eq(users.id, user.id));
  await audit(user.id, "auth.password_changed", "Changed password");
  return { ok: "Password updated." };
}

export async function updateAccount(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  if (name.length < 2) return { error: "Enter your name" };
  await db.update(users).set({ name, phone }).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: "Account updated." };
}
