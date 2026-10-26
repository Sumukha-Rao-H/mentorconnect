// Seeds demo accounts for every role plus sample mentoring data.
// Run with `npm run db:seed`. Safe to re-run: it wipes the app tables first.
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "./schema";

config({ path: ".env.local" });

// Shared password for every demo account (test data only).
export const DEMO_PASSWORD = "Mentor@2026";

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const daysFromNow = (d: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(hour, 0, 0, 0);
  return date;
};
const isoDate = (d: number) => daysFromNow(d).toISOString().slice(0, 10);

async function main() {
  await db.execute(
    sql`TRUNCATE audit_logs, meetings, goals, notes, mentee_profiles, users RESTART IDENTITY CASCADE`,
  );
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [admin, hod, mentorA, mentorB] = await db
    .insert(schema.users)
    .values([
      { name: "Anita Shenoy", email: "admin@nmamit.test", role: "admin", passwordHash },
      { name: "Dr. Raghavendra Rao", email: "hod@nmamit.test", role: "hod", passwordHash },
      { name: "Prof. Meera Kamath", email: "meera@nmamit.test", role: "mentor", passwordHash },
      { name: "Prof. Suresh Bhat", email: "suresh@nmamit.test", role: "mentor", passwordHash },
    ])
    .returning();

  const menteeSeed = [
    { name: "Kavya Hegde", email: "kavya@nmamit.test", usn: "4NM23IS041", sem: 5, mentor: mentorA, status: "endorsed", hobbies: "Carnatic music, badminton", skills: "React, Python, Figma", interests: "HCI, accessibility", career: "UX engineer", cgpa: 9.1 },
    { name: "Rohan Pai", email: "rohan@nmamit.test", usn: "4NM23IS088", sem: 5, mentor: mentorA, status: "submitted", hobbies: "Photography, trekking", skills: "Java, Spring Boot", interests: "Distributed systems", career: "Backend developer", cgpa: 8.4 },
    { name: "Sneha Nayak", email: "sneha@nmamit.test", usn: "4NM23IS112", sem: 5, mentor: mentorA, status: "changes_requested", hobbies: "Painting", skills: "C++, DSA", interests: "Competitive programming", career: "SDE", cgpa: 8.9 },
    { name: "Arjun Shetty", email: "arjun@nmamit.test", usn: "4NM23IS015", sem: 3, mentor: mentorB, status: "draft", hobbies: "Football, chess", skills: "HTML, CSS", interests: "Web development", career: "Full-stack developer", cgpa: 7.6 },
    { name: "Divya Prabhu", email: "divya@nmamit.test", usn: "4NM23IS033", sem: 3, mentor: mentorB, status: "submitted", hobbies: "Reading, blogging", skills: "Python, pandas", interests: "Data science", career: "Data analyst", cgpa: 8.7 },
    { name: "Nikhil Acharya", email: "nikhil@nmamit.test", usn: "4NM23IS070", sem: 7, mentor: null, status: "draft", hobbies: "Gaming", skills: "Unity, C#", interests: "Game dev", career: "Game developer", cgpa: 7.9 },
  ] as const;

  const mentees = await db
    .insert(schema.users)
    .values(menteeSeed.map((m) => ({ name: m.name, email: m.email, role: "mentee" as const, passwordHash })))
    .returning();

  await db.insert(schema.menteeProfiles).values(
    menteeSeed.map((m, i) => ({
      userId: mentees[i]!.id,
      usn: m.usn,
      semester: m.sem,
      section: i % 2 ? "B" : "A",
      dob: `200${4 + (i % 2)}-0${(i % 9) + 1}-1${i}`,
      phone: `98450${String(10000 + i * 1111).slice(0, 5)}`,
      address: "Nitte, Karkala, Udupi",
      guardianName: i % 2 ? "Mr. Prakash" : "Mrs. Lakshmi",
      guardianPhone: `94480${String(20000 + i * 1311).slice(0, 5)}`,
      cgpa: m.cgpa,
      hobbies: m.hobbies,
      skills: m.skills,
      interests: m.interests,
      careerGoal: m.career,
      bio: m.status === "draft" ? null : `${m.name.split(" ")[0]} is a semester ${m.sem} ISE student interested in ${m.interests.toLowerCase()}.`,
      achievements: i === 0 ? "Winner, Smart India Hackathon 2025 (internal round)" : null,
      mentorId: m.mentor?.id ?? null,
      status: m.status,
      submittedAt: m.status === "draft" ? null : daysFromNow(-3 - i),
      endorsedById: m.status === "endorsed" ? admin!.id : null,
      endorsedAt: m.status === "endorsed" ? daysFromNow(-1) : null,
      adminRemark: m.status === "changes_requested" ? "Please add your guardian's phone number and a short bio." : null,
    })),
  );

  const [kavya, rohan, sneha, arjun, divya] = mentees;
  await db.insert(schema.notes).values([
    { menteeId: kavya!.id, authorId: mentorA!.id, kind: "recommendation", title: "Apply for the Google STEP internship", body: "Your portfolio is strong. Apply before the December deadline and ask me for a letter of recommendation." },
    { menteeId: kavya!.id, authorId: mentorA!.id, kind: "note", title: "Semester 5 check-in", body: "Doing well academically. Wants more exposure to research — connect with the HCI lab.", isPrivate: true },
    { menteeId: rohan!.id, authorId: mentorA!.id, kind: "recommendation", title: "Take the cloud computing elective", body: "Fits your distributed systems interest; pair it with an AWS Cloud Practitioner certification." },
    { menteeId: sneha!.id, authorId: mentorA!.id, kind: "recommendation", title: "Join the ICPC practice group", body: "Weekly sessions on Saturdays in the CS lab. Great for your competitive programming goals." },
    { menteeId: arjun!.id, authorId: mentorB!.id, kind: "note", title: "Attendance concern", body: "Attendance in DBMS is at 68%. Discussed a plan to recover before the IA.", isPrivate: true },
    { menteeId: divya!.id, authorId: mentorB!.id, kind: "recommendation", title: "Kaggle micro-courses", body: "Complete the Intro to ML and Feature Engineering courses this month." },
  ]);

  await db.insert(schema.goals).values([
    { menteeId: kavya!.id, createdById: mentorA!.id, title: "Submit STEP application", dueDate: isoDate(0) },
    { menteeId: kavya!.id, createdById: kavya!.id, title: "Finish accessibility audit project", dueDate: isoDate(7) },
    { menteeId: kavya!.id, createdById: kavya!.id, title: "Update resume", dueDate: isoDate(-2), done: true },
    { menteeId: rohan!.id, createdById: mentorA!.id, title: "Enrol for cloud elective", dueDate: isoDate(3) },
    { menteeId: arjun!.id, createdById: mentorB!.id, title: "Raise DBMS attendance above 75%", dueDate: isoDate(14) },
    { menteeId: divya!.id, createdById: divya!.id, title: "Kaggle Intro to ML", dueDate: isoDate(5) },
  ]);

  await db.insert(schema.meetings).values([
    { mentorId: mentorA!.id, menteeId: kavya!.id, scheduledAt: daysFromNow(0, 15), agenda: "Internship applications review" },
    { mentorId: mentorA!.id, menteeId: rohan!.id, scheduledAt: daysFromNow(2, 11), agenda: "Elective selection" },
    { mentorId: mentorA!.id, menteeId: sneha!.id, scheduledAt: daysFromNow(-6, 14), agenda: "Mid-semester review", status: "completed", minutes: "Discussed IA marks and ICPC plans." },
    { mentorId: mentorB!.id, menteeId: arjun!.id, scheduledAt: daysFromNow(1, 10), agenda: "Attendance recovery plan" },
    { mentorId: mentorB!.id, menteeId: divya!.id, scheduledAt: daysFromNow(9, 12), agenda: "Data science roadmap" },
  ]);

  await db.insert(schema.auditLogs).values([
    { actorId: admin!.id, action: "profile.endorsed", details: "Endorsed Kavya Hegde (4NM23IS041)" },
    { actorId: admin!.id, action: "profile.changes_requested", details: "Requested changes from Sneha Nayak (4NM23IS112)" },
    { actorId: mentorA!.id, action: "note.created", details: "Recommendation for Kavya Hegde" },
    { actorId: hod!.id, action: "auth.login", details: "Signed in" },
  ]);

  console.log(`Seeded ${4 + mentees.length} users. Demo password: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
