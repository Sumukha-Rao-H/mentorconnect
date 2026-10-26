import Link from "next/link";
import { CalendarClock, Check, Lightbulb, Mail, Plus, Target } from "lucide-react";
import { acknowledgeNote, addOwnGoal, submitForEndorsement } from "@/app/actions/profile";
import { toggleGoal } from "@/app/actions/mentoring";
import { SubmitButton } from "@/components/forms";
import { RightRail, type RailTask } from "@/components/right-rail";
import { EmptyState, SectionHeader, StatusBadge } from "@/components/ui";
import type { CurrentUser } from "@/lib/dal";
import { formatDate, profileCompletion } from "@/lib/profile";
import { getMenteeBundle, isUpcoming, todayIST, toISTDate } from "@/lib/queries";
import { Hero } from "./hero";

export async function MenteeDashboard({ user }: { user: CurrentUser }) {
  const bundle = (await getMenteeBundle(user.id, user))!;
  const { profile, mentor } = bundle;
  const pct = profileCompletion(profile);
  const status = profile?.status ?? "draft";
  const recommendations = bundle.notes.filter((n) => n.note.kind === "recommendation");
  const openGoals = bundle.goals.filter((g) => !g.done);
  const upcoming = bundle.meetings
    .filter((m) => m.meeting.status === "scheduled" && isUpcoming(m.meeting.scheduledAt))
    .sort((a, b) => a.meeting.scheduledAt.getTime() - b.meeting.scheduledAt.getTime());
  const next = upcoming[0];
  const today = todayIST();

  const tasks: RailTask[] = [
    ...upcoming
      .filter((m) => toISTDate(m.meeting.scheduledAt) === today)
      .map((m) => ({ id: `m${m.meeting.id}`, label: m.meeting.agenda, meta: `Meeting · ${formatDate(m.meeting.scheduledAt, true)}`, tone: "teal" as const, href: "/meetings" })),
    ...openGoals
      .filter((g) => g.dueDate && g.dueDate <= today)
      .map((g) => ({ id: `g${g.id}`, label: g.title, meta: g.dueDate! < today ? "Overdue" : "Due today", tone: g.dueDate! < today ? ("ink" as const) : ("navy" as const) })),
  ];
  if (status === "draft" || status === "changes_requested") {
    tasks.push({ id: "profile", label: status === "draft" ? "Complete & submit your profile" : "Address admin remarks", tone: "mist", href: "/profile" });
  }

  return (
    <div className="flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-8">
        <Hero
          title="Your Profile"
          action={
            <>
              <Link href="/profile" className="btn-primary">
                {pct < 100 ? "Complete profile" : "Edit profile"}
              </Link>
              {(status === "draft" || status === "changes_requested") && pct >= 60 && (
                <form action={submitForEndorsement}>
                  <SubmitButton className="btn-outline" pendingText="Submitting…">Submit for endorsement</SubmitButton>
                </form>
              )}
            </>
          }
        >
          <p>
            Hi <b className="text-ink">{user.name.split(" ")[0]}</b>, your profile is <b className="text-ink">{pct}%</b> complete.{" "}
            {status === "endorsed" && "It has been endorsed by the administrator — great work."}
            {status === "submitted" && "It is waiting for the administrator's endorsement."}
            {status === "draft" && (pct >= 60 ? "Submit it for endorsement when you're ready." : "Fill in at least 60% to submit it for endorsement.")}
            {status === "changes_requested" && "The administrator asked for a few changes."}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <StatusBadge status={status} />
            {profile?.usn && <span className="text-xs font-bold text-ink/50">{profile.usn}</span>}
          </div>
          {status === "changes_requested" && profile?.adminRemark && (
            <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-xs text-ink">
              <b>Admin remark:</b> {profile.adminRemark}
            </p>
          )}
        </Hero>

        <section id="recommendations">
          <SectionHeader title="Recommendations for you" action={<span className="text-ink/50">{recommendations.length} total</span>} />
          {recommendations.length === 0 ? (
            <EmptyState>Your mentor&apos;s recommendations will show up here.</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {recommendations.slice(0, 6).map(({ note, authorName }) => (
                <article key={note.id} className="flex flex-col rounded-2xl bg-canvas p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-9 items-center justify-center rounded-full bg-white text-teal">
                      <Lightbulb className="size-4" />
                    </span>
                    {!note.acknowledged && <span className="rounded bg-teal px-1.5 py-0.5 text-[10px] font-bold text-white">New</span>}
                  </div>
                  <h3 className="mt-3 font-bold text-ink">{note.title}</h3>
                  <p className="mt-1 line-clamp-3 flex-1 text-sm text-ink/65">{note.body}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-ink/50">
                    <span>{authorName} · {formatDate(note.createdAt)}</span>
                    {!note.acknowledged && (
                      <form action={acknowledgeNote.bind(null, note.id)}>
                        <button className="inline-flex cursor-pointer items-center gap-1 font-bold text-teal hover:underline">
                          <Check className="size-3" /> Got it
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="Your goals" action={<span className="text-ink/50">{bundle.goals.filter((g) => g.done).length}/{bundle.goals.length} done</span>} />
          <ul className="space-y-2">
            {bundle.goals.map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-xl border border-mist px-4 py-3">
                <form action={toggleGoal.bind(null, g.id)}>
                  <button
                    aria-label={g.done ? "Mark as not done" : "Mark as done"}
                    className={`flex size-5 cursor-pointer items-center justify-center rounded-md border-2 ${g.done ? "border-teal bg-teal text-white" : "border-mist"}`}
                  >
                    {g.done && <Check className="size-3" />}
                  </button>
                </form>
                <span className={`flex-1 text-sm ${g.done ? "text-ink/40 line-through" : "text-ink"}`}>{g.title}</span>
                {g.dueDate && <span className="text-xs text-ink/50">{formatDate(g.dueDate)}</span>}
              </li>
            ))}
          </ul>
          <form action={addOwnGoal} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input name="title" required placeholder="Add a personal goal…" className="input flex-1" />
            <input name="dueDate" type="date" className="input sm:w-44" aria-label="Due date" />
            <SubmitButton className="btn-navy" pendingText="Adding…">
              <Plus className="size-4" /> Add
            </SubmitButton>
          </form>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="flex min-h-36 items-center justify-between gap-4 rounded-2xl bg-teal p-6 text-white">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wide text-white/70">Your mentor</div>
              <div className="mt-1 truncate text-xl font-bold">{mentor?.name ?? "Not assigned yet"}</div>
              {mentor && (
                <a href={`mailto:${mentor.email}`} className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/85 hover:underline">
                  <Mail className="size-4" /> {mentor.email}
                </a>
              )}
            </div>
            <Target className="size-12 shrink-0 text-white/30" />
          </div>
          <div className="flex min-h-36 items-center justify-between gap-4 rounded-2xl bg-navy p-6 text-white">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wide text-white/70">Next meeting</div>
              <div className="mt-1 truncate text-xl font-bold">{next ? next.meeting.agenda : "None scheduled"}</div>
              {next && <div className="mt-2 text-sm text-white/85">{formatDate(next.meeting.scheduledAt, true)}</div>}
            </div>
            <CalendarClock className="size-12 shrink-0 text-white/30" />
          </div>
        </section>
      </div>

      <RightRail
        events={upcoming.map((m) => toISTDate(m.meeting.scheduledAt))}
        tasksTitle="Your Tasks Today"
        tasks={tasks}
        taskAction={<Link href="/meetings" className="btn-outline px-6 py-2 text-xs">View meetings</Link>}
        callout={
          <div className="rounded-2xl border border-mist p-5 text-center">
            <div className="font-bold text-ink">Endorsement</div>
            <div className="mt-3 flex justify-center"><StatusBadge status={status} /></div>
            <p className="mt-3 text-xs text-ink/55">
              {profile?.endorsedAt ? `Endorsed on ${formatDate(profile.endorsedAt)}` : "Endorsement confirms the administrator has verified your details."}
            </p>
          </div>
        }
      />
    </div>
  );
}
