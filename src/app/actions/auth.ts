"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { menteeProfiles, users } from "@/db/schema";
import { audit, getCurrentUser } from "@/lib/dal";
import { createSession, deleteSession } from "@/lib/session";

export type FormState = { error?: string; ok?: string; fields?: Record<string, string> } | undefined;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
  const valid = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!valid) return { error: "Incorrect email or password.", fields: { email: parsed.data.email } };
  if (!user.active) return { error: "This account has been deactivated. Contact the administrator." };

  await createSession({ userId: user.id, role: user.role, name: user.name });
  await audit(user.id, "auth.login", "Signed in");
  redirect("/dashboard");
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name"),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    usn: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[0-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/, "USN should look like 4NM23IS041"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

// Only mentees self-register. Mentors, admins and HODs are created by an admin.
export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = registerSchema.safeParse(raw);
  const fields = { name: raw.name ?? "", email: raw.email ?? "", usn: raw.usn ?? "" };
  if (!parsed.success) return { error: parsed.error.issues[0]!.message, fields };

  const { name, email, usn, password } = parsed.data;
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return { error: "An account with this email already exists.", fields };
  const [usnTaken] = await db
    .select({ id: menteeProfiles.userId })
    .from(menteeProfiles)
    .where(eq(menteeProfiles.usn, usn));
  if (usnTaken) return { error: "This USN is already registered.", fields };

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({ name, email, passwordHash, role: "mentee" }).returning();
  await db.insert(menteeProfiles).values({ userId: user!.id, usn });
  await audit(user!.id, "auth.register", `New mentee ${name} (${usn})`);
  await createSession({ userId: user!.id, role: "mentee", name });
  redirect("/profile?welcome=1");
}

export async function logout() {
  const user = await getCurrentUser();
  if (user) await audit(user.id, "auth.logout", "Signed out");
  await deleteSession();
  redirect("/login");
}
