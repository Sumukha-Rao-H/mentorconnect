import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { cancelMeeting, completeMeeting } from "@/app/actions/mentoring";
import { ConfirmButton, SubmitButton } from "@/components/forms";
import { Calendar } from "@/components/calendar";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { formatDate } from "@/lib/profile";
import { isUpcoming, listMeetings, todayIST, toISTDate } from "@/lib/queries";

export const metadata: Metadata = { title: "Meetings" };

const STATUS_STYLE = {
  scheduled: "bg-navy/10 text-navy",
  completed: "bg-teal text-white",
  cancelled: "bg-mist text-ink",
} as const;

export default async function MeetingsPage() {
  const user = await requireUser();
  const all = await listMeetings(user);
  const upcoming = all
    .filter((m) => m.meeting.status === "scheduled" && isUpcoming(m.meeting.scheduledAt))
    .reverse();
  const past = all.filter((m) => !upcoming.includes(m));

  const row = (m: (typeof all)[number]) => (
    <li key={m.meeting.id} className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-canvas text-teal">
          <CalendarClock className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-ink">{m.meeting.agenda}</div>
          <div className="text-xs text-ink/55">
            {formatDate(m.meeting.scheduledAt, true)} ·{" "}
            {user.role === "mentee" ? (
              <>with {m.mentorName}</>
            ) : (
              <>
                {user.role !== "mentor" && <>{m.mentorName} ↔ </>}
                <Link href={`/mentees/${m.menteeId}`} className="font-bold text-teal hover:underline">{m.menteeName}</Link>
              </>
            )}
          </div>
          {m.meeting.minutes && <p className="mt-2 text-sm text-ink/70"><b>Minutes:</b> {m.meeting.minutes}</p>}
        </div>
        <span className={`rounded px-2 py-0.5 text-[11px] font-bold capitalize ${STATUS_STYLE[m.meeting.status]}`}>{m.meeting.status}</span>
      </div>
      {user.role === "mentor" && m.meeting.status === "scheduled" && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:pl-13">
          <form action={completeMeeting.bind(null, m.meeting.id)} className="flex flex-1 gap-2">
            <input name="minutes" placeholder="Minutes of the meeting (optional)" className="input py-1.5" />
            <SubmitButton className="btn-primary px-4 py-1.5 text-xs" pendingText="…">Complete</SubmitButton>
          </form>
          <form action={cancelMeeting.bind(null, m.meeting.id)}>
            <ConfirmButton message="Cancel this meeting?" className="btn-ghost text-xs">Cancel</ConfirmButton>
          </form>
        </div>
      )}
    </li>
  );

  return (
    <div className="flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1">
        <PageHeader
          title="Meetings"
          subtitle={user.role === "mentor" ? "Schedule new meetings from a mentee's page." : "Mentoring sessions and their minutes."}
        />
        <div data-tour="meetings-upcoming">
          <h2 className="section-title mb-3">Upcoming ({upcoming.length})</h2>
          {upcoming.length === 0 ? <EmptyState>No upcoming meetings.</EmptyState> : <ul className="space-y-3">{upcoming.map(row)}</ul>}
        </div>
        <div data-tour="meetings-history" className="mt-10">
          <h2 className="section-title mb-3">History ({past.length})</h2>
          {past.length === 0 ? <EmptyState>No past meetings.</EmptyState> : <ul className="space-y-3">{past.map(row)}</ul>}
        </div>
      </div>
      <aside className="xl:w-80 xl:shrink-0">
        <div data-tour="calendar" className="xl:sticky xl:top-6">
          <Calendar events={upcoming.map((m) => toISTDate(m.meeting.scheduledAt))} today={todayIST()} />
        </div>
      </aside>
    </div>
  );
}
