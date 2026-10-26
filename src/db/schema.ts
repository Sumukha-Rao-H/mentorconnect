import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["mentee", "mentor", "admin", "hod"]);
export const profileStatusEnum = pgEnum("profile_status", [
  "draft",
  "submitted",
  "endorsed",
  "changes_requested",
]);
export const noteKindEnum = pgEnum("note_kind", ["note", "recommendation"]);
export const meetingStatusEnum = pgEnum("meeting_status", [
  "scheduled",
  "completed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("mentee"),
  department: text("department").notNull().default("ISE"),
  phone: text("phone"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const menteeProfiles = pgTable(
  "mentee_profiles",
  {
    userId: integer("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    usn: text("usn").unique(),
    semester: integer("semester"),
    section: text("section"),
    dob: date("dob"),
    phone: text("phone"),
    address: text("address"),
    guardianName: text("guardian_name"),
    guardianPhone: text("guardian_phone"),
    cgpa: real("cgpa"),
    hobbies: text("hobbies"),
    skills: text("skills"),
    interests: text("interests"),
    achievements: text("achievements"),
    careerGoal: text("career_goal"),
    bio: text("bio"),
    photo: text("photo"),
    mentorId: integer("mentor_id").references(() => users.id, { onDelete: "set null" }),
    status: profileStatusEnum("status").notNull().default("draft"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    endorsedById: integer("endorsed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    endorsedAt: timestamp("endorsed_at", { withTimezone: true }),
    adminRemark: text("admin_remark"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("mentee_profiles_mentor_idx").on(t.mentorId)],
);

export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    menteeId: integer("mentee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: noteKindEnum("kind").notNull().default("note"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    // Private notes are visible to staff only, never to the mentee.
    isPrivate: boolean("is_private").notNull().default(false),
    acknowledged: boolean("acknowledged").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notes_mentee_idx").on(t.menteeId)],
);

export const goals = pgTable(
  "goals",
  {
    id: serial("id").primaryKey(),
    menteeId: integer("mentee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdById: integer("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    dueDate: date("due_date"),
    done: boolean("done").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("goals_mentee_idx").on(t.menteeId)],
);

export const meetings = pgTable(
  "meetings",
  {
    id: serial("id").primaryKey(),
    mentorId: integer("mentor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    menteeId: integer("mentee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    agenda: text("agenda").notNull(),
    status: meetingStatusEnum("status").notNull().default("scheduled"),
    minutes: text("minutes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("meetings_mentor_idx").on(t.mentorId),
    index("meetings_mentee_idx").on(t.menteeId),
  ],
);

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Role = (typeof roleEnum.enumValues)[number];
export type ProfileStatus = (typeof profileStatusEnum.enumValues)[number];
export type User = typeof users.$inferSelect;
export type MenteeProfile = typeof menteeProfiles.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
