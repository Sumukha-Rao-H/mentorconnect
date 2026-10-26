"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { goals, meetings, notes, users } from "@/db/schema";
import { assertCanViewMentee, audit, requirePermission, requireUser } from "@/lib/dal";
import type { FormState } from "./auth";

async function menteeName(id: number) {
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, id));
  return u?.name ?? `#${id}`;
}

const noteSchema = z.object({
  kind: z.enum(["note", "recommendation"]),
  title: z.string().trim().min(3, "Give it a short title"),
  body: z.string().trim().min(5, "Write a few words"),
});

export async function addNote(menteeId: number, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("note:create");
  await assertCanViewMentee(user, menteeId);
  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  // Recommendations are always shared with the mentee; plain notes can be private.
  const isPrivate = parsed.data.kind === "note" && formData.get("isPrivate") === "on";

  await db.insert(notes).values({ menteeId, authorId: user.id, ...parsed.data, isPrivate });
  await audit(
    user.id,
    parsed.data.kind === "recommendation" ? "recommendation.created" : "note.created",
    `${parsed.data.kind === "recommendation" ? "Recommendation" : "Note"} for ${await menteeName(menteeId)}: ${parsed.data.title}`,
  );
  revalidatePath(`/mentees/${menteeId}`);
  return { ok: "Saved." };
}

export async function deleteNote(noteId: number) {
  const user = await requireUser();
  const [note] = await db.select().from(notes).where(eq(notes.id, noteId));
  if (!note) return;
  if (note.authorId !== user.id && user.role !== "admin") throw new Error("Only the author can delete this.");
  await db.delete(notes).where(eq(notes.id, noteId));
  await audit(user.id, "note.deleted", `Deleted "${note.title}"`);
  revalidatePath(`/mentees/${note.menteeId}`);
}

export async function addGoal(menteeId: number, formData: FormData) {
  const user = await requirePermission("goal:create");
  await assertCanViewMentee(user, menteeId);
  const title = String(formData.get("title") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "") || null;
  if (!title) return;
  await db.insert(goals).values({ menteeId, createdById: user.id, title, dueDate });
  revalidatePath("/", "layout");
}

export async function toggleGoal(goalId: number) {
  const user = await requireUser();
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId));
  if (!goal) return;
  await assertCanViewMentee(user, goal.menteeId);
  if (user.role === "hod") throw new Error("The HOD has read-only access.");
  await db.update(goals).set({ done: !goal.done }).where(eq(goals.id, goalId));
  revalidatePath("/", "layout");
}

export async function deleteGoal(goalId: number) {
  const user = await requireUser();
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId));
  if (!goal) return;
  if (goal.createdById !== user.id && user.role !== "admin") throw new Error("Only the creator can delete this goal.");
  await db.delete(goals).where(eq(goals.id, goalId));
  revalidatePath("/", "layout");
}

const meetingSchema = z.object({
  scheduledAt: z.string().min(1, "Pick a date and time"),
  agenda: z.string().trim().min(3, "Add an agenda"),
});

export async function scheduleMeeting(menteeId: number, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("meeting:schedule");
  await assertCanViewMentee(user, menteeId);
  const parsed = meetingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  // datetime-local has no zone; the department runs on IST.
  const scheduledAt = new Date(`${parsed.data.scheduledAt}:00+05:30`);
  if (Number.isNaN(scheduledAt.getTime())) return { error: "Invalid date" };

  await db.insert(meetings).values({ mentorId: user.id, menteeId, scheduledAt, agenda: parsed.data.agenda });
  await audit(user.id, "meeting.scheduled", `Meeting with ${await menteeName(menteeId)}: ${parsed.data.agenda}`);
  revalidatePath("/", "layout");
  return { ok: "Meeting scheduled." };
}

export async function completeMeeting(meetingId: number, formData: FormData) {
  const user = await requirePermission("meeting:schedule");
  const minutes = String(formData.get("minutes") ?? "").trim() || null;
  await db
    .update(meetings)
    .set({ status: "completed", minutes })
    .where(and(eq(meetings.id, meetingId), eq(meetings.mentorId, user.id)));
  await audit(user.id, "meeting.completed", `Meeting #${meetingId} marked complete`);
  revalidatePath("/", "layout");
}

export async function cancelMeeting(meetingId: number) {
  const user = await requirePermission("meeting:schedule");
  await db
    .update(meetings)
    .set({ status: "cancelled" })
    .where(and(eq(meetings.id, meetingId), eq(meetings.mentorId, user.id)));
  await audit(user.id, "meeting.cancelled", `Meeting #${meetingId} cancelled`);
  revalidatePath("/", "layout");
}
