import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { auditLogs, goals, meetings, menteeProfiles, notes, users, type ProfileStatus, type Role } from "@/db/schema";
import type { CurrentUser } from "./dal";

const mentor = alias(users, "mentor");
const mentee = alias(users, "mentee");

export function todayIST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

// Matches listMeetings({ upcomingOnly }): anything from the start of today (IST).
export function isUpcoming(d: Date) {
  return toISTDate(d) >= todayIST();
}

export function toISTDate(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export type MenteeFilters = { mentorId?: number; q?: string; status?: string; semester?: string; unassigned?: boolean };

export async function listMentees(filters: MenteeFilters = {}) {
  const where: SQL[] = [eq(users.role, "mentee")];
  if (filters.mentorId) where.push(eq(menteeProfiles.mentorId, filters.mentorId));
  if (filters.unassigned) where.push(isNull(menteeProfiles.mentorId));
  if (filters.q) {
    const q = `%${filters.q}%`;
    where.push(or(ilike(users.name, q), ilike(menteeProfiles.usn, q), ilike(users.email, q))!);
  }
  if (filters.status && ["draft", "submitted", "endorsed", "changes_requested"].includes(filters.status)) {
    where.push(eq(menteeProfiles.status, filters.status as ProfileStatus));
  }
  if (filters.semester && /^[1-8]$/.test(filters.semester)) {
    where.push(eq(menteeProfiles.semester, Number(filters.semester)));
  }
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      active: users.active,
      profile: menteeProfiles,
      mentorName: mentor.name,
    })
    .from(users)
    .leftJoin(menteeProfiles, eq(menteeProfiles.userId, users.id))
    .leftJoin(mentor, eq(mentor.id, menteeProfiles.mentorId))
    .where(and(...where))
    .orderBy(asc(users.name));
}

export async function listMentors() {
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.role, "mentor"), eq(users.active, true)))
    .orderBy(asc(users.name));
}

export async function getMenteeBundle(menteeId: number, viewer: CurrentUser) {
  const [row] = await db
    .select({ user: users, profile: menteeProfiles, mentor: { id: mentor.id, name: mentor.name, email: mentor.email, phone: mentor.phone } })
    .from(users)
    .leftJoin(menteeProfiles, eq(menteeProfiles.userId, users.id))
    .leftJoin(mentor, eq(mentor.id, menteeProfiles.mentorId))
    .where(and(eq(users.id, menteeId), eq(users.role, "mentee")));
  if (!row) return null;

  const author = alias(users, "author");
  const noteWhere = [eq(notes.menteeId, menteeId)];
  // Mentees never see private staff notes.
  if (viewer.role === "mentee") noteWhere.push(eq(notes.isPrivate, false));
  const [noteRows, goalRows, meetingRows] = await Promise.all([
    db
      .select({ note: notes, authorName: author.name, authorRole: author.role })
      .from(notes)
      .innerJoin(author, eq(author.id, notes.authorId))
      .where(and(...noteWhere))
      .orderBy(desc(notes.createdAt)),
    db.select().from(goals).where(eq(goals.menteeId, menteeId)).orderBy(asc(goals.done), asc(goals.dueDate)),
    db
      .select({ meeting: meetings, mentorName: mentor.name })
      .from(meetings)
      .innerJoin(mentor, eq(mentor.id, meetings.mentorId))
      .where(eq(meetings.menteeId, menteeId))
      .orderBy(desc(meetings.scheduledAt)),
  ]);

  const safeUser = { ...row.user, passwordHash: undefined };
  return {
    user: safeUser,
    profile: row.profile,
    mentor: row.mentor?.id ? row.mentor : null,
    notes: noteRows,
    goals: goalRows,
    meetings: meetingRows,
  };
}

export async function listMeetings(viewer: CurrentUser, opts: { upcomingOnly?: boolean; limit?: number } = {}) {
  const where: SQL[] = [];
  if (viewer.role === "mentee") where.push(eq(meetings.menteeId, viewer.id));
  if (viewer.role === "mentor") where.push(eq(meetings.mentorId, viewer.id));
  if (opts.upcomingOnly) {
    where.push(gte(meetings.scheduledAt, sql`date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata'`));
    where.push(eq(meetings.status, "scheduled"));
  }
  const q = db
    .select({ meeting: meetings, mentorName: mentor.name, menteeName: mentee.name, menteeId: mentee.id })
    .from(meetings)
    .innerJoin(mentor, eq(mentor.id, meetings.mentorId))
    .innerJoin(mentee, eq(mentee.id, meetings.menteeId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(opts.upcomingOnly ? asc(meetings.scheduledAt) : desc(meetings.scheduledAt));
  return opts.limit ? q.limit(opts.limit) : q;
}

export async function recentNotes(opts: { authorId?: number; menteeIds?: number[]; kind?: "note" | "recommendation"; limit?: number }) {
  const where: SQL[] = [];
  if (opts.authorId) where.push(eq(notes.authorId, opts.authorId));
  if (opts.menteeIds) {
    if (!opts.menteeIds.length) return [];
    where.push(inArray(notes.menteeId, opts.menteeIds));
  }
  if (opts.kind) where.push(eq(notes.kind, opts.kind));
  const author = alias(users, "author");
  return db
    .select({ note: notes, menteeName: mentee.name, authorName: author.name })
    .from(notes)
    .innerJoin(mentee, eq(mentee.id, notes.menteeId))
    .innerJoin(author, eq(author.id, notes.authorId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(notes.createdAt))
    .limit(opts.limit ?? 5);
}

export async function profileStatusCounts() {
  const rows = await db
    .select({ status: menteeProfiles.status, n: count() })
    .from(menteeProfiles)
    .innerJoin(users, eq(users.id, menteeProfiles.userId))
    .where(eq(users.role, "mentee"))
    .groupBy(menteeProfiles.status);
  const out: Record<ProfileStatus, number> = { draft: 0, submitted: 0, endorsed: 0, changes_requested: 0 };
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export async function roleCounts() {
  const rows = await db.select({ role: users.role, n: count() }).from(users).where(eq(users.active, true)).groupBy(users.role);
  const out: Record<Role, number> = { mentee: 0, mentor: 0, admin: 0, hod: 0 };
  for (const r of rows) out[r.role] = r.n;
  return out;
}

export async function mentorWorkload() {
  // Drizzle renders columns unqualified inside sql``, so "id" would bind to the
  // subquery's own table. Qualify the outer mentor id explicitly.
  const mentorId = sql.raw(`"users"."id"`);
  return db
    .select({
      id: users.id,
      name: users.name,
      mentees: sql<number>`(select count(*)::int from ${menteeProfiles} where ${menteeProfiles.mentorId} = ${mentorId})`,
      endorsed: sql<number>`(select count(*)::int from ${menteeProfiles} where ${menteeProfiles.mentorId} = ${mentorId} and ${menteeProfiles.status} = 'endorsed')`,
      notes: sql<number>`(select count(*)::int from ${notes} where ${notes.authorId} = ${mentorId})`,
      meetings: sql<number>`(select count(*)::int from ${meetings} where ${meetings.mentorId} = ${mentorId} and ${meetings.status} = 'completed')`,
    })
    .from(users)
    .where(eq(users.role, "mentor"))
    .orderBy(asc(users.name));
}

export async function semesterDistribution() {
  return db
    .select({ semester: menteeProfiles.semester, n: count() })
    .from(menteeProfiles)
    .groupBy(menteeProfiles.semester)
    .orderBy(asc(menteeProfiles.semester));
}

export async function recentActivity(limit = 8) {
  const actor = alias(users, "actor");
  return db
    .select({ log: auditLogs, actorName: actor.name, actorRole: actor.role })
    .from(auditLogs)
    .leftJoin(actor, eq(actor.id, auditLogs.actorId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

// A real mentee for the tour to open on the "Mentee details" steps.
export async function tourSampleMentee(viewer: CurrentUser): Promise<number | null> {
  if (viewer.role === "mentee") return null;
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(menteeProfiles, eq(menteeProfiles.userId, users.id))
    .where(and(eq(users.role, "mentee"), viewer.role === "mentor" ? eq(menteeProfiles.mentorId, viewer.id) : undefined))
    // Admins land on a submitted profile so the endorse controls are visible.
    .orderBy(sql`${menteeProfiles.status} = 'submitted' desc`, asc(users.name))
    .limit(1);
  return row?.id ?? null;
}

export async function notificationCount(viewer: CurrentUser) {
  if (viewer.role === "mentee") {
    const [r] = await db
      .select({ n: count() })
      .from(notes)
      .where(and(eq(notes.menteeId, viewer.id), eq(notes.kind, "recommendation"), eq(notes.acknowledged, false)));
    return r?.n ?? 0;
  }
  if (viewer.role === "admin") {
    const [r] = await db.select({ n: count() }).from(menteeProfiles).where(eq(menteeProfiles.status, "submitted"));
    return r?.n ?? 0;
  }
  const upcoming = await listMeetings(viewer, { upcomingOnly: true });
  return upcoming.filter((m) => toISTDate(m.meeting.scheduledAt) === todayIST()).length;
}
