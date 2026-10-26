"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { goals, menteeProfiles, notes } from "@/db/schema";
import { audit, requirePermission, requireUser } from "@/lib/dal";
import { profileCompletion } from "@/lib/profile";
import type { FormState } from "./auth";

const optional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const profileSchema = z.object({
  usn: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/, "USN should look like 4NM23IS041"),
  semester: z.coerce.number().int().min(1).max(8),
  section: optional,
  dob: optional,
  phone: z
    .string()
    .trim()
    .regex(/^$|^[0-9+\- ]{10,15}$/, "Enter a valid phone number")
    .transform((v) => v || null),
  address: optional,
  guardianName: optional,
  guardianPhone: z
    .string()
    .trim()
    .regex(/^$|^[0-9+\- ]{10,15}$/, "Enter a valid guardian phone number")
    .transform((v) => v || null),
  cgpa: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (v >= 0 && v <= 10), "CGPA must be between 0 and 10"),
  hobbies: optional,
  skills: optional,
  interests: optional,
  achievements: optional,
  careerGoal: optional,
  bio: optional,
  photo: optional,
});

export async function saveProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("profile:edit-own");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const data = parsed.data;

  if (data.photo && (!data.photo.startsWith("data:image/") || data.photo.length > 600_000)) {
    return { error: "Photo must be an image under ~400 KB." };
  }

  const [clash] = await db
    .select({ id: menteeProfiles.userId })
    .from(menteeProfiles)
    .where(and(eq(menteeProfiles.usn, data.usn), ne(menteeProfiles.userId, user.id)));
  if (clash) return { error: "That USN belongs to another student." };

  const [current] = await db.select().from(menteeProfiles).where(eq(menteeProfiles.userId, user.id));
  // Editing an endorsed or submitted profile sends it back to draft so the
  // administrator always endorses exactly what is on record.
  const resetStatus = current && current.status !== "draft" && current.status !== "changes_requested";

  await db
    .insert(menteeProfiles)
    .values({ userId: user.id, ...data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: menteeProfiles.userId,
      set: {
        ...data,
        updatedAt: new Date(),
        ...(resetStatus ? { status: "draft" as const, endorsedAt: null, endorsedById: null } : {}),
      },
    });

  await audit(user.id, "profile.updated", `${user.name} updated their profile`);
  revalidatePath("/", "layout");
  return {
    ok: resetStatus
      ? "Saved. Your profile went back to draft — submit it again for endorsement."
      : "Profile saved.",
  };
}

export async function submitForEndorsement() {
  const user = await requirePermission("profile:edit-own");
  const [profile] = await db.select().from(menteeProfiles).where(eq(menteeProfiles.userId, user.id));
  if (!profile) throw new Error("Fill in your profile first.");
  if (profileCompletion(profile) < 60) throw new Error("Complete at least 60% of your profile before submitting.");

  await db
    .update(menteeProfiles)
    .set({ status: "submitted", submittedAt: new Date(), adminRemark: null })
    .where(eq(menteeProfiles.userId, user.id));
  await audit(user.id, "profile.submitted", `${user.name} (${profile.usn}) submitted their profile`);
  revalidatePath("/", "layout");
}

export async function acknowledgeNote(noteId: number) {
  const user = await requireUser();
  await db
    .update(notes)
    .set({ acknowledged: true })
    .where(and(eq(notes.id, noteId), eq(notes.menteeId, user.id), eq(notes.isPrivate, false)));
  revalidatePath("/", "layout");
}

export async function addOwnGoal(formData: FormData) {
  const user = await requirePermission("goal:create");
  if (user.role !== "mentee") throw new Error("Mentors add goals from the mentee page.");
  const title = String(formData.get("title") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "") || null;
  if (!title) return;
  await db.insert(goals).values({ menteeId: user.id, createdById: user.id, title, dueDate });
  revalidatePath("/", "layout");
}
