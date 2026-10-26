import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { RightRail, type RailTask } from "@/components/right-rail";
import { EmptyState, SectionHeader, Stat } from "@/components/ui";
import type { CurrentUser } from "@/lib/dal";
import { formatDate } from "@/lib/profile";
import { listMeetings, mentorWorkload, profileStatusCounts, recentNotes, roleCounts, todayIST, toISTDate } from "@/lib/queries";
import { Hero } from "./hero";

export async function HodDashboard({ user }: { user: CurrentUser }) {
  const [status, roles, workload, recs, upcoming] = await Promise.all([
    profileStatusCounts(),
    roleCounts(),
    mentorWorkload(),
    recentNotes({ kind: "recommendation", limit: 4 }),
    listMeetings(user, { upcomingOnly: true }),
  ]);
  const total = status.draft + status.submitted + status.endorsed + status.changes_requested;
  const endorsedPct = total ? Math.round((status.endorsed / total) * 100) : 0;
  const today = todayIST();
  const tasks: RailTask[] = upcoming.slice(0, 5).map((m) => ({
    id: `m${m.meeting.id}`,
    label: `${m.mentorName} ↔ ${m.menteeName}`,
    meta: `${m.meeting.agenda} · ${formatDate(m.meeting.scheduledAt, true)}`,
    tone: toISTDate(m.meeting.scheduledAt) === today ? "teal" : "navy",
    href: `/mentees/${m.menteeId}`,
  }));
  const bars = [
    { label: "Endorsed", value: status.endorsed, cls: "bg-teal" },
    { label: "Awaiting endorsement", value: status.submitted, cls: "bg-navy" },
    { label: "Changes requested", value: status.changes_requested, cls: "bg-ink" },
    { label: "Draft", value: status.draft, cls: "bg-mist" },
  ];

  return (
    <div className="flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-8">
        <Hero title="Department Overview" action={<Link href="/reports" className="btn-primary">Open reports</Link>}>
          <p>
            Welcome, <b className="text-ink">{user.name}</b>. {roles.mentor} mentors are guiding {roles.mentee} mentees in {user.department}.{" "}
            <b className="text-ink">{endorsedPct}%</b> of mentee profiles are endorsed.
          </p>
        </Hero>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Mentees" value={roles.mentee} tone="navy" />
          <Stat label="Mentors" value={roles.mentor} tone="teal" />
          <Stat label="Endorsed" value={`${endorsedPct}%`} hint={`${status.endorsed} of ${total}`} />
          <Stat label="Upcoming meetings" value={upcoming.length} tone="ink" />
        </section>

        <section>
          <SectionHeader title="Profile status" />
          <div className="flex h-4 overflow-hidden rounded-full bg-canvas" role="img" aria-label="Profile status distribution">
            {bars.map((b) => (b.value ? <div key={b.label} className={b.cls} style={{ width: `${(b.value / Math.max(total, 1)) * 100}%` }} /> : null))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink/70">
            {bars.map((b) => (
              <li key={b.label} className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-sm ${b.cls}`} /> {b.label} <b className="text-ink">{b.value}</b>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionHeader title="Mentor workload" action={<Link href="/reports" className="hover:underline">View more</Link>} />
          <div className="overflow-x-auto rounded-2xl border border-mist">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-canvas text-xs uppercase tracking-wide text-ink/55">
                <tr>
                  <th className="px-4 py-3">Mentor</th>
                  <th className="px-4 py-3">Mentees</th>
                  <th className="px-4 py-3">Endorsed</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Meetings held</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {workload.map((w) => (
                  <tr key={w.id}>
                    <td className="px-4 py-3 font-bold text-ink">{w.name}</td>
                    <td className="px-4 py-3">{w.mentees}</td>
                    <td className="px-4 py-3">{w.endorsed}</td>
                    <td className="px-4 py-3">{w.notes}</td>
                    <td className="px-4 py-3">{w.meetings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <SectionHeader title="Latest recommendations" />
          {recs.length === 0 ? (
            <EmptyState>No recommendations yet.</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {recs.map(({ note, menteeName, authorName }) => (
                <Link key={note.id} href={`/mentees/${note.menteeId}`} className="flex items-start gap-3 rounded-2xl bg-canvas p-4 hover:bg-white hover:shadow-card">
                  <Lightbulb className="mt-0.5 size-5 shrink-0 text-teal" />
                  <div className="min-w-0">
                    <div className="font-bold text-ink">{note.title}</div>
                    <div className="text-xs text-ink/55">{authorName} → {menteeName} · {formatDate(note.createdAt)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <RightRail
        events={upcoming.map((m) => toISTDate(m.meeting.scheduledAt))}
        tasksTitle="Mentoring Meetings"
        tasks={tasks}
        taskAction={<Link href="/meetings" className="btn-outline px-6 py-2 text-xs">All meetings</Link>}
        callout={
          <div className="rounded-2xl border border-mist p-5 text-center">
            <div className="font-bold text-ink">Read-only access</div>
            <p className="mt-2 text-xs text-ink/55">As HOD you can view every profile, note and meeting. Changes are made by mentors and the administrator.</p>
            <Link href="/activity" className="btn-outline mt-4 px-6 py-2 text-xs">Activity log</Link>
          </div>
        }
      />
    </div>
  );
}
