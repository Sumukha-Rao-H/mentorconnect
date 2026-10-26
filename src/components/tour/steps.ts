import type { Role } from "@/db/schema";

export type TourStep = {
  id: string;
  /** Page the step lives on; the tour navigates here first. */
  path: string;
  /** Section label used for grouping on the Help page. */
  page: string;
  /**
   * `data-tour` anchors to highlight, in order of preference. The first one
   * that is visible wins, so a desktop-only element can fall back to its
   * mobile equivalent. No visible anchor → the step shows as a centred card.
   */
  targets?: string[];
  title: string;
  body: string;
};

export type TourContext = { sampleMenteeId?: number | null };

const step = (page: string, path: string, id: string, targets: string[] | undefined, title: string, body: string): TourStep => ({
  id,
  path,
  page,
  targets,
  title,
  body,
});

function common(role: Role) {
  const nav = step(
    "Getting around",
    "/dashboard",
    "nav",
    ["nav", "menu-button"],
    "Navigation",
    role === "mentee"
      ? "Every page you can use is listed here: Home, My Profile, Meetings, Help and Settings. On a phone, open it with the menu button."
      : "Every page your role can open is listed here. Pages you don't have access to are never shown. On a phone, open it with the menu button.",
  );
  const welcome = step(
    "Getting around",
    "/dashboard",
    "welcome",
    undefined,
    "Welcome to MentorConnect",
    "This short tour walks you through every page and what you can do on it. Use Next and Back, or the arrow keys. Press Esc to leave at any time — you can restart it from the Tour button or the Help page.",
  );
  const settings = [
    step("Settings", "/settings", "settings-account", ["settings-account"], "Your account", "Update the name and phone number other people see."),
    step("Settings", "/settings", "settings-password", ["settings-password"], "Change password", "Enter your current password and a new one of at least 8 characters. Admin-issued temporary passwords should be changed here on first sign-in."),
  ];
  const help = step(
    "Help",
    "/help",
    "help",
    ["help-page", "tour-button"],
    "Help is always here",
    "This page lists every function available to you, grouped by page. Use “Show me” on any section to replay just that part of the tour, or the Tour button in the top bar to start over.",
  );
  return { welcome, nav, settings, help };
}

function menteeSteps(): TourStep[] {
  const { welcome, nav, settings, help } = common("mentee");
  const D = "Home dashboard";
  const P = "My Profile";
  const M = "Meetings";
  return [
    welcome,
    nav,
    step(D, "/dashboard", "hero", ["hero"], "Your profile at a glance", "See how complete your profile is and its endorsement status. When it's at least 60% complete you can submit it for endorsement straight from here."),
    step(D, "/dashboard", "recommendations", ["recommendations"], "Recommendations", "Advice from your mentor appears here. New ones are marked “New” — click “Got it” to let your mentor know you've seen it."),
    step(D, "/dashboard", "goals", ["goals"], "Goals", "Goals set by you or your mentor. Tick the box when one is done, or add your own with an optional due date."),
    step(D, "/dashboard", "mentor-cards", ["mentor-cards"], "Mentor & next meeting", "Your assigned mentor with a one-click email link, and your next scheduled meeting."),
    step(D, "/dashboard", "calendar", ["calendar"], "Calendar", "Days with a dot have a meeting. Use the arrows to move between months."),
    step(D, "/dashboard", "tasks", ["tasks"], "Tasks today", "Meetings happening today, goals that are due or overdue, and reminders such as finishing your profile."),
    step(D, "/dashboard", "endorsement-status", ["endorsement-status"], "Endorsement status", "Shows whether the administrator has endorsed your profile, and when."),
    step(D, "/dashboard", "notifications", ["notifications"], "Notifications", "The bell counts recommendations you haven't acknowledged yet."),
    step(P, "/profile", "photo", ["photo"], "Profile photo", "Upload a photo — it's cropped to a square and resized automatically, so any phone picture works."),
    step(P, "/profile", "profile-basic", ["profile-basic"], "Basic details", "USN and semester are required. Your name comes from your account and can be changed in Settings."),
    step(P, "/profile", "profile-contact", ["profile-contact"], "Contact details", "Your phone, address and a parent or guardian contact for your mentor."),
    step(P, "/profile", "profile-about", ["profile-about"], "About you", "Hobbies, skills and interests — separate several with commas and they show as tags for your mentor. Add achievements, your career goal and a short bio."),
    step(P, "/profile", "profile-save", ["profile-save"], "Save often", "Save at any time. Editing a profile that was already submitted or endorsed sends it back to draft so the administrator can re-check it."),
    step(P, "/profile", "profile-submit", ["profile-submit"], "Submit for endorsement", "Once you reach 60% completion, submit your profile. If the administrator asks for changes, their remark appears at the top of this page."),
    step(M, "/meetings", "meetings-upcoming", ["meetings-upcoming"], "Upcoming meetings", "Sessions your mentor has scheduled with you, with date, time and agenda."),
    step(M, "/meetings", "meetings-history", ["meetings-history"], "Meeting history", "Past and cancelled meetings, including the minutes your mentor recorded."),
    ...settings,
    help,
  ];
}

function mentorSteps(ctx: TourContext): TourStep[] {
  const { welcome, nav, settings, help } = common("mentor");
  const D = "Home dashboard";
  const L = "Mentees";
  const X = "Mentee details";
  const detail = ctx.sampleMenteeId ? `/mentees/${ctx.sampleMenteeId}` : null;
  return [
    welcome,
    nav,
    step(D, "/dashboard", "hero", ["hero"], "Your mentoring summary", "How many students you mentor, how many still need to finish their profile, and your upcoming meetings."),
    step(D, "/dashboard", "mentee-cards", ["mentee-cards"], "Assigned mentees", "Each card shows the student's photo, USN, profile completion and endorsement status. Click one to open their full record."),
    step(D, "/dashboard", "recent-notes", ["recent-notes"], "Your recent notes", "The latest recommendations and notes you've written. Private notes are labelled."),
    step(D, "/dashboard", "tasks", ["tasks", "calendar"], "Upcoming meetings", "Your next sessions, with today's highlighted. The calendar above marks every meeting day."),
    step(D, "/dashboard", "needs-attention", ["needs-attention", "hero"], "Needs attention", "Students whose profiles are still in draft or need changes, so you can nudge them."),
    step(D, "/dashboard", "search", ["search"], "Quick search", "Find any of your mentees by name, USN or email from any page."),
    step(L, "/mentees", "mentee-filters", ["mentee-filters"], "Filter your mentees", "Narrow the list by name, endorsement status or semester."),
    step(L, "/mentees", "mentee-list", ["mentee-list"], "Mentee list", "Everyone assigned to you. On a phone it switches to cards. Open a student to work with them."),
    ...(detail
      ? [
          step(X, detail, "mentee-header", ["mentee-header"], "Student overview", "Photo, USN, semester, contact links, status and profile completion."),
          step(X, detail, "mentee-profile", ["mentee-profile"], "Profile information", "Everything the student entered: contacts, guardian, CGPA, hobbies, skills, interests and bio."),
          step(X, detail, "notes", ["notes"], "Recommendations & notes", "Write a Recommendation (always visible to the student) or a Note. Notes can be marked Private so only staff can read them. You can delete what you wrote."),
          step(X, detail, "goals-panel", ["goals-panel"], "Goals", "Set goals with due dates. You and the student can tick them off."),
          step(X, detail, "meetings-panel", ["meetings-panel"], "Meetings", "Schedule a meeting with a date, time and agenda. Afterwards, mark it complete with minutes, or cancel it."),
          step(X, detail, "endorsement-panel", ["endorsement-panel"], "Endorsement status", "See whether the administrator has endorsed this profile and any remark they left. Endorsing is the administrator's job."),
        ]
      : []),
    step("Meetings", "/meetings", "meetings-upcoming", ["meetings-upcoming"], "All your meetings", "Every upcoming session across your mentees. Complete them with minutes or cancel right from this list."),
    ...settings,
    help,
  ];
}

function adminSteps(ctx: TourContext): TourStep[] {
  const { welcome, nav, settings, help } = common("admin");
  const D = "Home dashboard";
  const detail = ctx.sampleMenteeId ? `/mentees/${ctx.sampleMenteeId}` : null;
  return [
    welcome,
    nav,
    step(D, "/dashboard", "hero", ["hero"], "Administration summary", "How many profiles are waiting for endorsement and how many mentees still need a mentor."),
    step(D, "/dashboard", "stats", ["stats"], "Key numbers", "Active mentees and mentors, endorsed profiles and your pending reviews."),
    step(D, "/dashboard", "endorsement-queue", ["endorsement-queue"], "Endorsement queue", "The oldest submissions first. “Review” opens the full profile."),
    step(D, "/dashboard", "unassigned", ["unassigned"], "Assign mentors", "Students without a mentor. Pick a mentor and press Assign — the mentor sees them immediately."),
    step(D, "/dashboard", "activity-feed", ["activity-feed"], "Recent activity", "A live feed of sign-ins, submissions, endorsements, notes and meetings."),
    step(D, "/dashboard", "notifications", ["notifications"], "Notifications", "The bell counts profiles waiting for your endorsement."),
    step("Endorsements", "/endorsements", "endorse-queue", ["endorse-queue"], "Review submissions", "Each submitted profile with key details. “Quick endorse” approves it in one click; “Review in full” lets you add a remark or request changes."),
    step("Endorsements", "/endorsements", "endorse-history", ["endorse-history"], "Returned & endorsed", "Profiles you sent back (with your remark) and those already endorsed."),
    step("Mentees", "/mentees", "mentee-filters", ["mentee-filters"], "Find any mentee", "Filter every student by name, status, semester or mentor — including “Unassigned”."),
    step("Mentees", "/mentees", "export", ["export"], "Export to CSV", "Download the current filtered list as a spreadsheet."),
    step("Mentees", "/mentees", "mentee-list", ["mentee-list"], "All mentees", "Every student with their mentor, completion and status."),
    ...(detail
      ? [
          step("Mentee details", detail, "endorsement-panel", ["endorsement-panel"], "Endorse or request changes", "Endorse the profile, or request changes with a remark the student will see. An endorsed profile can also be revoked."),
          step("Mentee details", detail, "mentor-panel", ["mentor-panel"], "Change mentor", "Reassign or unassign this student's mentor."),
          step("Mentee details", detail, "notes", ["notes"], "Notes oversight", "You can read every note, including private ones, and remove inappropriate entries."),
        ]
      : []),
    step("Reports", "/reports", "report-stats", ["report-stats"], "Department reports", "Headline numbers, including the mentee-to-mentor ratio and endorsement rate."),
    step("Reports", "/reports", "report-workload", ["report-workload"], "Mentor workload", "Compare how many mentees, notes and meetings each mentor has, to balance assignments."),
    step("Users", "/users", "users-list", ["users-list"], "Manage users", "Change anyone's role or deactivate an account. Deactivated users are signed out on their next request."),
    step("Users", "/users", "create-user", ["create-user"], "Create accounts", "Add mentors, HODs, other admins or mentees with a temporary password."),
    step("Activity log", "/activity", "activity-log", ["activity-log"], "Audit trail", "The latest 100 actions with who did them and when."),
    ...settings,
    help,
  ];
}

function hodSteps(ctx: TourContext): TourStep[] {
  const { welcome, nav, settings, help } = common("hod");
  const D = "Home dashboard";
  const detail = ctx.sampleMenteeId ? `/mentees/${ctx.sampleMenteeId}` : null;
  return [
    welcome,
    nav,
    step(D, "/dashboard", "hero", ["hero"], "Department overview", "Mentors, mentees and the share of endorsed profiles in your department. Your access is read-only."),
    step(D, "/dashboard", "stats", ["stats"], "Key numbers", "Mentees, mentors, endorsement rate and upcoming meetings."),
    step(D, "/dashboard", "status-bar", ["status-bar"], "Profile status", "How profiles split between endorsed, awaiting endorsement, changes requested and draft."),
    step(D, "/dashboard", "workload", ["workload"], "Mentor workload", "Mentees, endorsements, notes and completed meetings per mentor."),
    step(D, "/dashboard", "latest-recs", ["latest-recs"], "Latest recommendations", "What mentors are recommending, and to whom."),
    step(D, "/dashboard", "tasks", ["tasks", "calendar"], "Mentoring meetings", "Upcoming sessions across the department."),
    step("Mentees", "/mentees", "mentee-filters", ["mentee-filters"], "Browse every mentee", "Filter by name, status, semester or mentor."),
    step("Mentees", "/mentees", "export", ["export"], "Export to CSV", "Download the filtered list for meetings or records."),
    ...(detail
      ? [
          step("Mentee details", detail, "mentee-profile", ["mentee-profile"], "Full student record", "Every profile field the student entered."),
          step("Mentee details", detail, "notes", ["notes"], "All notes", "Recommendations and private staff notes are visible to you, but you can't edit them."),
        ]
      : []),
    step("Reports", "/reports", "report-stats", ["report-stats"], "Reports", "Department-wide statistics at a glance."),
    step("Reports", "/reports", "report-semesters", ["report-semesters"], "By semester", "How many mentees are in each semester."),
    step("Reports", "/reports", "report-workload", ["report-workload"], "Workload balance", "Spot mentors who are over- or under-loaded."),
    step("Activity log", "/activity", "activity-log", ["activity-log"], "Audit trail", "Who did what and when, across the whole department."),
    ...settings,
    help,
  ];
}

export function getTourSteps(role: Role, ctx: TourContext = {}): TourStep[] {
  switch (role) {
    case "mentee":
      return menteeSteps();
    case "mentor":
      return mentorSteps(ctx);
    case "admin":
      return adminSteps(ctx);
    case "hod":
      return hodSteps(ctx);
  }
}
