import Link from "next/link";
import { assignMentor } from "@/app/actions/admin";
import { SubmitButton } from "@/components/forms";
import { Avatar, EmptyState, SectionHeader, Stat } from "@/components/ui";
import { ActivityFeed } from "@/components/activity-feed";
import type { CurrentUser } from "@/lib/dal";
import { formatDate, profileCompletion } from "@/lib/profile";
import { listMentees, listMentors, profileStatusCounts, recentActivity, roleCounts } from "@/lib/queries";
import { Hero } from "./hero";

export async function AdminDashboard({ user }: { user: CurrentUser }) {
  const [status, roles, pending, unassigned, mentors, activity] = await Promise.all([
    profileStatusCounts(),
    roleCounts(),
    listMentees({ status: "submitted" }),
    listMentees({ unassigned: true }),
    listMentors(),
    recentActivity(8),
  ]);

  return (
    <div className="flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-8">
        <Hero title="Administration" action={<Link href="/endorsements" className="btn-primary">Review endorsements</Link>}>
          <p>
            Hi <b className="text-ink">{user.name.split(" ")[0]}</b>, there {pending.length === 1 ? "is" : "are"}{" "}
            <b className="text-ink">{pending.length}</b> profile{pending.length === 1 ? "" : "s"} waiting for endorsement and{" "}
            <b className="text-ink">{unassigned.length}</b> mentee{unassigned.length === 1 ? "" : "s"} without a mentor.
          </p>
        </Hero>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Mentees" value={roles.mentee} tone="navy" />
          <Stat label="Mentors" value={roles.mentor} tone="teal" />
          <Stat label="Endorsed" value={status.endorsed} hint={`${status.changes_requested} need changes`} />
          <Stat label="Pending" value={status.submitted} tone="ink" hint="Awaiting your review" />
        </section>

        <section>
          <SectionHeader title="Endorsement queue" action={<Link href="/endorsements" className="hover:underline">View more</Link>} />
          {pending.length === 0 ? (
            <EmptyState>No profiles are waiting. Nice and tidy.</EmptyState>
          ) : (
            <ul className="divide-y divide-mist rounded-2xl border border-mist">
              {pending.slice(0, 5).map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Avatar name={m.name} photo={m.profile?.photo} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-ink">{m.name}</div>
                    <div className="text-xs text-ink/50">
                      {m.profile?.usn} · submitted {formatDate(m.profile?.submittedAt)} · {profileCompletion(m.profile)}% complete
                    </div>
                  </div>
                  <Link href={`/mentees/${m.id}#endorsement`} className="btn-outline px-4 py-1.5 text-xs">Review</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionHeader title="Mentees without a mentor" />
          {unassigned.length === 0 ? (
            <EmptyState>Every mentee has a mentor.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {unassigned.map((m) => (
                <li key={m.id} className="flex flex-col gap-3 rounded-2xl bg-canvas px-4 py-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={m.name} photo={m.profile?.photo} size={36} />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-ink">{m.name}</div>
                      <div className="text-xs text-ink/50">{m.profile?.usn ?? "USN pending"} · Sem {m.profile?.semester ?? "—"}</div>
                    </div>
                  </div>
                  <form action={assignMentor.bind(null, m.id)} className="flex gap-2">
                    <select name="mentorId" required aria-label={`Mentor for ${m.name}`} className="input py-2 sm:w-48">
                      <option value="">Choose mentor…</option>
                      {mentors.map((mt) => (
                        <option key={mt.id} value={mt.id}>{mt.name}</option>
                      ))}
                    </select>
                    <SubmitButton className="btn-navy px-4 py-2" pendingText="…">Assign</SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="space-y-6 xl:w-80 xl:shrink-0">
        <div className="card p-5">
          <h3 className="border-b border-mist pb-3 text-center font-bold text-ink">Recent activity</h3>
          <ActivityFeed items={activity} compact />
          <div className="mt-3 text-center">
            <Link href="/activity" className="btn-outline px-6 py-2 text-xs">Full log</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-mist p-5 text-center">
          <div className="font-bold text-ink">Add staff</div>
          <p className="mt-2 text-xs text-ink/55">Create mentor, admin or HOD accounts and manage roles.</p>
          <Link href="/users" className="btn-primary mt-4 px-6 py-2 text-xs">Manage users</Link>
        </div>
      </aside>
    </div>
  );
}
