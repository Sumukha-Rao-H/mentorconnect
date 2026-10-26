import { getCurrentUser } from "@/lib/dal";
import { can } from "@/lib/rbac";
import { listMentees } from "@/lib/queries";
import { profileCompletion, STATUS_LABEL } from "@/lib/profile";

function csvCell(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote everything and neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "report:view")) {
    return new Response("Forbidden", { status: 403 });
  }
  const sp = new URL(req.url).searchParams;
  const mentor = sp.get("mentor") ?? "";
  const rows = await listMentees({
    q: sp.get("q") || undefined,
    status: sp.get("status") || undefined,
    semester: sp.get("semester") || undefined,
    mentorId: mentor && mentor !== "none" ? Number(mentor) : undefined,
    unassigned: mentor === "none",
  });

  const header = ["Name", "Email", "USN", "Semester", "Section", "CGPA", "Phone", "Mentor", "Status", "Completion %", "Hobbies", "Skills", "Interests", "Career goal"];
  const lines = rows.map((r) =>
    [
      r.name,
      r.email,
      r.profile?.usn,
      r.profile?.semester,
      r.profile?.section,
      r.profile?.cgpa,
      r.profile?.phone,
      r.mentorName,
      STATUS_LABEL[r.profile?.status ?? "draft"],
      profileCompletion(r.profile),
      r.profile?.hobbies,
      r.profile?.skills,
      r.profile?.interests,
      r.profile?.careerGoal,
    ]
      .map(csvCell)
      .join(","),
  );
  const body = [header.map(csvCell).join(","), ...lines].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mentees-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
