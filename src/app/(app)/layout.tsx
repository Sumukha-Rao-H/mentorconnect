import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { menteeProfiles } from "@/db/schema";
import { Sidebar } from "@/components/sidebar";
import { Avatar } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { profileCompletion } from "@/lib/profile";
import { notificationCount, profileStatusCounts } from "@/lib/queries";
import { ROLE_LABEL } from "@/lib/rbac";

async function SidebarFooter({ userId, isMentee }: { userId: number; isMentee: boolean }) {
  let label: React.ReactNode;
  let pct: number;
  if (isMentee) {
    const [p] = await db.select().from(menteeProfiles).where(eq(menteeProfiles.userId, userId));
    pct = profileCompletion(p);
    label = (
      <>
        Profile <span className="text-lg font-black">{pct}%</span> complete
      </>
    );
  } else {
    const c = await profileStatusCounts();
    const total = c.draft + c.submitted + c.endorsed + c.changes_requested;
    pct = total ? Math.round((c.endorsed / total) * 100) : 0;
    label = (
      <>
        Endorsed <span className="text-lg font-black">{c.endorsed}</span> of {total}
      </>
    );
  }
  return (
    <div className="px-1 text-sm text-white">
      <div className="mb-2">{label}</div>
      <div className="h-2 overflow-hidden rounded-full bg-ink/40">
        <div className="h-full bg-white" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [photoRow, notifications] = await Promise.all([
    user.role === "mentee"
      ? db.select({ photo: menteeProfiles.photo }).from(menteeProfiles).where(eq(menteeProfiles.userId, user.id))
      : Promise.resolve([]),
    notificationCount(user),
  ]);
  const photo = photoRow[0]?.photo ?? null;
  const canSearch = user.role !== "mentee";

  return (
    <div className="min-h-dvh lg:p-6">
      <div className="mx-auto flex min-h-dvh max-w-[1500px] flex-col overflow-hidden bg-white lg:min-h-[calc(100dvh-3rem)] lg:flex-row lg:rounded-[2rem] lg:shadow-card">
        <Sidebar role={user.role} footer={<SidebarFooter userId={user.id} isMentee={user.role === "mentee"} />} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-mist/70 px-4 py-4 sm:px-6 lg:px-8">
            {canSearch ? (
              <form action="/mentees" className="relative w-full max-w-md">
                <input
                  name="q"
                  placeholder="Search mentees by name or USN…"
                  aria-label="Search mentees"
                  className="w-full rounded-xl bg-canvas py-2.5 pl-4 pr-10 text-sm outline-none ring-teal/30 placeholder:text-ink/50 focus:ring-2"
                />
                <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
              </form>
            ) : (
              <p className="hidden text-sm text-ink/60 sm:block">What do you want to achieve today?</p>
            )}
            <div className="ml-auto flex items-center gap-3 sm:gap-4">
              <Link
                href={user.role === "admin" ? "/endorsements" : user.role === "mentee" ? "/dashboard#recommendations" : "/meetings"}
                aria-label={`${notifications} notifications`}
                className="relative rounded-full p-2 text-ink/60 hover:bg-mist/50"
              >
                <Bell className="size-5" />
                {notifications > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-white">
                    {notifications}
                  </span>
                )}
              </Link>
              <Link href={user.role === "mentee" ? "/profile" : "/settings"} className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-bold leading-tight text-ink">{user.name}</div>
                  <div className="text-xs text-ink/55">{ROLE_LABEL[user.role]}</div>
                </div>
                <Avatar name={user.name} photo={photo} size={38} />
              </Link>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
