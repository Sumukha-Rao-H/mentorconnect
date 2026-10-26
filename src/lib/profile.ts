import type { MenteeProfile, ProfileStatus } from "@/db/schema";

const COMPLETION_FIELDS = [
  "usn",
  "semester",
  "section",
  "dob",
  "phone",
  "address",
  "guardianName",
  "guardianPhone",
  "cgpa",
  "hobbies",
  "skills",
  "interests",
  "careerGoal",
  "bio",
  "photo",
] as const satisfies readonly (keyof MenteeProfile)[];

export function profileCompletion(profile: Partial<MenteeProfile> | null | undefined) {
  if (!profile) return 0;
  const filled = COMPLETION_FIELDS.filter((f) => {
    const v = profile[f];
    return v !== null && v !== undefined && String(v).trim() !== "";
  }).length;
  return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}

export const STATUS_LABEL: Record<ProfileStatus, string> = {
  draft: "Draft",
  submitted: "Awaiting endorsement",
  endorsed: "Endorsed",
  changes_requested: "Changes requested",
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function formatDate(d: Date | string | null | undefined, withTime = false) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "Asia/Kolkata",
  });
}
