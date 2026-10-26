import Link from "next/link";
import { Lightbulb, NotebookPen } from "lucide-react";
import { RightRail, type RailTask } from "@/components/right-rail";
import { Avatar, EmptyState, Progress, SectionHeader, StatusBadge } from "@/components/ui";
import type { CurrentUser } from "@/lib/dal";
import { formatDate, profileCompletion } from "@/lib/profile";
import { listMeetings, listMentees, recentNotes, todayIST, toISTDate } from "@/lib/queries";
import { Hero } from "./hero";

export async function MentorDashboard({ user }: { user: CurrentUser }) {
  const [mentees, upcoming, notes] = await Promise.all([
    listMentees({ mentorId: user.id }),
    listMeetings(user, { upcomingOnly: true }),
    recentNotes({ authorId: user.id, limit: 4 }),
  ]);
  const needsAttention = mentees.filter((m) => !m.profile || m.profile.status === "draft" || m.profile.status === "changes_requested");
  const today = todayIST();
  const tasks: RailTask[] = upcoming.slice(0, 5).map((m) => ({
    id: `m${m.meeting.id}`,
    label: `${m.menteeName}: ${m.meeting.agenda}`,
    meta: formatDate(m.meeting.scheduledAt, true),
    tone: toISTDate(m.meeting.scheduledAt) === today ? "teal" : "navy",
    href: `/mentees/${m.menteeId}`,
  }));

  return (
    <div className="flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-8">
        <Hero title="Your Mentees" action={<Link href="/mentees" className="btn-primary">View all mentees</Link>}>
          <p>
            Hi <b className="text-ink">{user.name.replace(/^(Prof\.|Dr\.)\s*/, "").split(" ")[0]}</b>, you mentor{" "}
            <b className="text-ink">{mentees.length}</b> students.{" "}
            {needsAttention.length > 0
              ? `${needsAttention.length} of them still ${needsAttention.length === 1 ? "needs" : "need"} to finish their profile.`
              : "Every profile is complete or under review."}{" "}
            You have <b className="text-ink">{upcoming.length}</b> upcoming meetings.
          </p>
        </Hero>

        <section data-tour="mentee-cards">
          <SectionHeader title="Assigned mentees" action={<Link href="/mentees" className="hover:underline">View more</Link>} />
          {mentees.length === 0 ? (
            <EmptyState>No mentees have been assigned to you yet. The administrator handles assignments.</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {mentees.slice(0, 6).map((m) => {
                const pct = profileCompletion(m.profile);
                return (
                  <Link key={m.id} href={`/mentees/${m.id}`} className="group flex flex-col items-center rounded-2xl bg-canvas p-5 text-center transition hover:bg-white hover:shadow-card">
                    <Avatar name={m.name} photo={m.profile?.photo} size={52} />
                    <h3 className="mt-3 font-bold text-ink group-hover:text-teal">{m.name}</h3>
                    <p className="text-xs text-ink/50">{m.profile?.usn ?? "USN pending"} · Sem {m.profile?.semester ?? "—"}</p>
                    <div className="mt-2">
                      <StatusBadge status={m.profile?.status ?? "draft"} />
                    </div>
                    <div className="mt-3 w-full">
                      <Progress value={pct} label />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section data-tour="recent-notes">
          <SectionHeader title="Your recent notes" />
          {notes.length === 0 ? (
            <EmptyState>Open a mentee to add notes and recommendations.</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {notes.map(({ note, menteeName }) => (
                <Link
                  key={note.id}
                  href={`/mentees/${note.menteeId}`}
                  className={`flex min-h-32 items-start justify-between gap-4 rounded-2xl p-5 text-white transition hover:opacity-95 ${note.kind === "recommendation" ? "bg-teal" : "bg-navy"}`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wide text-white/70">
                      {note.kind === "recommendation" ? "Recommendation" : note.isPrivate ? "Private note" : "Note"} · {menteeName}
                    </div>
                    <div className="mt-1 text-lg font-bold">{note.title}</div>
                    <div className="mt-1 text-xs text-white/75">{formatDate(note.createdAt)}</div>
                  </div>
                  {note.kind === "recommendation" ? <Lightbulb className="size-10 shrink-0 text-white/30" /> : <NotebookPen className="size-10 shrink-0 text-white/30" />}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <RightRail
        events={upcoming.map((m) => toISTDate(m.meeting.scheduledAt))}
        tasksTitle="Upcoming Meetings"
        tasks={tasks}
        taskAction={<Link href="/meetings" className="btn-outline px-6 py-2 text-xs">All meetings</Link>}
        callout={
          needsAttention.length > 0 && (
            <div data-tour="needs-attention" className="rounded-2xl border border-mist p-5">
              <div className="text-center font-bold text-ink">Needs attention</div>
              <ul className="mt-3 space-y-2">
                {needsAttention.slice(0, 4).map((m) => (
                  <li key={m.id}>
                    <Link href={`/mentees/${m.id}`} className="flex items-center gap-2 text-sm hover:text-teal">
                      <Avatar name={m.name} photo={m.profile?.photo} size={26} />
                      <span className="flex-1 truncate">{m.name}</span>
                      <span className="text-xs text-ink/50">{profileCompletion(m.profile)}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        }
      />
    </div>
  );
}
