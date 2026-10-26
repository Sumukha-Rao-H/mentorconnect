import type { MenteeProfile, Role } from "@/db/schema";

// Single source of truth for who may do what. Pages, server actions and the
// proxy all check against this map so the rules can't drift apart.
export const PERMISSIONS = {
  "profile:edit-own": ["mentee"],
  "mentee:view-assigned": ["mentor"],
  "mentee:view-all": ["admin", "hod"],
  "note:create": ["mentor"],
  "note:view-private": ["mentor", "admin", "hod"],
  "goal:create": ["mentor", "mentee"],
  "meeting:schedule": ["mentor"],
  "profile:endorse": ["admin"],
  "mentor:assign": ["admin"],
  "user:manage": ["admin"],
  "audit:view": ["admin", "hod"],
  "report:view": ["admin", "hod"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission) {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

type Viewer = { id: number; role: Role };

export function canViewMentee(viewer: Viewer, menteeId: number, profile: Pick<MenteeProfile, "mentorId"> | null) {
  if (viewer.role === "admin" || viewer.role === "hod") return true;
  if (viewer.role === "mentee") return viewer.id === menteeId;
  return profile?.mentorId === viewer.id;
}

// Route prefixes that are limited to particular roles. The proxy uses this for
// an early redirect; each page re-checks with the fresh role from the database.
export const ROUTE_ROLES: { prefix: string; roles: readonly Role[] }[] = [
  { prefix: "/profile", roles: ["mentee"] },
  { prefix: "/mentees", roles: ["mentor", "admin", "hod"] },
  { prefix: "/users", roles: ["admin"] },
  { prefix: "/endorsements", roles: ["admin"] },
  { prefix: "/activity", roles: ["admin", "hod"] },
  { prefix: "/reports", roles: ["admin", "hod"] },
];

export const ROLE_LABEL: Record<Role, string> = {
  mentee: "Mentee",
  mentor: "Mentor",
  admin: "Administrator",
  hod: "Head of Department",
};
