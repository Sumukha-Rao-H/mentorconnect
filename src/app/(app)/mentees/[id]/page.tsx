import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Check, Lightbulb, Lock, Mail, NotebookPen, Phone, Plus, Trash2 } from "lucide-react";
import { assignMentor, endorseProfile, requestChanges } from "@/app/actions/admin";
import { addGoal, cancelMeeting, completeMeeting, deleteGoal, deleteNote, toggleGoal } from "@/app/actions/mentoring";
import { ConfirmButton, SubmitButton } from "@/components/forms";
import { Avatar, Chips, EmptyState, InfoRow, Progress, SectionHeader, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/dal";
import { formatDate, profileCompletion } from "@/lib/profile";
import { getMenteeBundle, listMentors } from "@/lib/queries";
import { can, canViewMentee } from "@/lib/rbac";
import { MeetingForm, NoteForm } from "./forms";

export const metadata: Metadata = { title: "Mentee" };

export default async function MenteeDetailPage(props: PageProps<"/mentees/[id]">) {
  const user = await requireRole("mentor", "admin", "hod");
  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) notFound();
  const bundle = await getMenteeBundle(id, user);
  if (!bundle) notFound();
  if (!canViewMentee(user, id, bundle.profile)) {
    return <EmptyState>This student isn&apos;t one of your mentees.</EmptyState>;
  }

  const { user: mentee, profile, mentor } = bundle;
  const pct = profileCompletion(profile);
  const status = profile?.status ?? "draft";
  const isMentor = user.role === "mentor";
  const canEndorse = can(user.role, "profile:endorse");
  const canAssign = can(user.role, "mentor:assign");
  const mentors = canAssign ? await listMentors() : [];

  return (
    <div className="space-y-6">
      <Link href="/mentees" className="inline-flex items-center gap-1.5 text-sm font-bold text-teal hover:underline">
        <ArrowLeft className="size-4" /> Back to mentees
      </Link>

      {/* Header */}
      <section data-tour="mentee-header" className="card overflow-hidden">
        <div className="h-20 bg-navy sm:h-24" />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-8">
          <div className="-mt-12">
            <Avatar name={mentee.name} photo={profile?.photo} size={96} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-ink">{mentee.name}</h1>
            <p className="text-sm text-ink/60">
              {profile?.usn ?? "USN pending"} · Semester {profile?.semester ?? "—"}
              {profile?.section ? ` · Section ${profile.section}` : ""} · {mentee.department}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink/60">
              <StatusBadge status={status} />
              <a href={`mailto:${mentee.email}`} className="inline-flex items-center gap-1 hover:text-teal"><Mail className="size-3.5" /> {mentee.email}</a>
              {profile?.phone && <a href={`tel:${profile.phone}`} className="inline-flex items-center gap-1 hover:text-teal"><Phone className="size-3.5" /> {profile.phone}</a>}
            </div>
          </div>
          <div className="w-full sm:w-48">
            <div className="mb-1 text-xs font-bold text-ink/55">Profile completion</div>
            <Progress value={pct} label />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          {/* Profile info */}
          <section data-tour="mentee-profile" className="card p-5 sm:p-6">
            <SectionHeader title="Profile" />
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Date of birth" value={profile?.dob ? formatDate(profile.dob) : null} />
              <InfoRow label="CGPA" value={profile?.cgpa?.toFixed(2)} />
              <InfoRow label="Address" value={profile?.address} />
              <InfoRow label="Guardian" value={profile?.guardianName} />
              <InfoRow label="Guardian phone" value={profile?.guardianPhone} />
              <InfoRow label="Career goal" value={profile?.careerGoal} />
            </dl>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              <div><div className="label">Hobbies</div><Chips value={profile?.hobbies} /></div>
              <div><div className="label">Skills</div><Chips value={profile?.skills} /></div>
              <div><div className="label">Interests</div><Chips value={profile?.interests} /></div>
            </div>
            <dl className="mt-6 grid gap-5">
              <InfoRow label="Achievements" value={profile?.achievements} />
              <InfoRow label="Bio" value={profile?.bio} />
            </dl>
          </section>

          {/* Notes & recommendations */}
          <section data-tour="notes" className="card p-5 sm:p-6">
            <SectionHeader title="Notes & recommendations" action={<span className="text-ink/50">{bundle.notes.length}</span>} />
            {isMentor && <NoteForm menteeId={id} />}
            {bundle.notes.length === 0 ? (
              <EmptyState>No notes yet.</EmptyState>
            ) : (
              <ul className="mt-4 space-y-3">
                {bundle.notes.map(({ note, authorName }) => (
                  <li key={note.id} className={`rounded-2xl border-l-4 p-4 ${note.kind === "recommendation" ? "border-teal bg-teal/5" : "border-navy bg-canvas"}`}>
                    <div className="flex items-start gap-3">
                      {note.kind === "recommendation" ? <Lightbulb className="mt-0.5 size-4 shrink-0 text-teal" /> : <NotebookPen className="mt-0.5 size-4 shrink-0 text-navy" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-ink">{note.title}</h3>
                          {note.isPrivate && (
                            <span className="inline-flex items-center gap-1 rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white"><Lock className="size-3" /> Private</span>
                          )}
                          {note.kind === "recommendation" && note.acknowledged && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal"><Check className="size-3" /> Seen by mentee</span>
                          )}
                        </div>
                        <p className="mt-1 whitespace-pre-line text-sm text-ink/75">{note.body}</p>
                        <p className="mt-2 text-[11px] text-ink/50">{authorName} · {formatDate(note.createdAt, true)}</p>
                      </div>
                      {(note.authorId === user.id || user.role === "admin") && (
                        <form action={deleteNote.bind(null, note.id)}>
                          <ConfirmButton message="Delete this note?" className="btn-ghost px-2 py-1">
                            <Trash2 className="size-4" /><span className="sr-only">Delete</span>
                          </ConfirmButton>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Meetings */}
          <section data-tour="meetings-panel" className="card p-5 sm:p-6">
            <SectionHeader title="Meetings" />
            {isMentor && <MeetingForm menteeId={id} />}
            {bundle.meetings.length === 0 ? (
              <EmptyState>No meetings yet.</EmptyState>
            ) : (
              <ul className="mt-4 divide-y divide-mist">
                {bundle.meetings.map(({ meeting, mentorName }) => (
                  <li key={meeting.id} className="py-3">
                    <div className="flex flex-wrap items-start gap-3">
                      <CalendarClock className="mt-0.5 size-4 shrink-0 text-teal" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-ink">{meeting.agenda}</div>
                        <div className="text-xs text-ink/55">{formatDate(meeting.scheduledAt, true)} · with {mentorName}</div>
                        {meeting.minutes && <p className="mt-1 text-sm text-ink/70"><b>Minutes:</b> {meeting.minutes}</p>}
                      </div>
                      <span className={`rounded px-2 py-0.5 text-[11px] font-bold capitalize ${meeting.status === "scheduled" ? "bg-navy/10 text-navy" : meeting.status === "completed" ? "bg-teal text-white" : "bg-mist text-ink"}`}>
                        {meeting.status}
                      </span>
                    </div>
                    {isMentor && meeting.status === "scheduled" && meeting.mentorId === user.id && (
                      <div className="mt-2 flex flex-col gap-2 pl-7 sm:flex-row">
                        <form action={completeMeeting.bind(null, meeting.id)} className="flex flex-1 gap-2">
                          <input name="minutes" placeholder="Minutes (optional)" className="input py-1.5" />
                          <SubmitButton className="btn-primary px-4 py-1.5 text-xs" pendingText="…">Complete</SubmitButton>
                        </form>
                        <form action={cancelMeeting.bind(null, meeting.id)}>
                          <ConfirmButton message="Cancel this meeting?" className="btn-ghost text-xs">Cancel</ConfirmButton>
                        </form>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {/* Endorsement */}
          <section id="endorsement" data-tour="endorsement-panel" className="card scroll-mt-6 p-5">
            <h2 className="font-bold text-ink">Endorsement</h2>
            <div className="mt-3 flex items-center gap-2"><StatusBadge status={status} /></div>
            <p className="mt-3 text-xs text-ink/60">
              {status === "endorsed" && `Endorsed on ${formatDate(profile?.endorsedAt)}.`}
              {status === "submitted" && `Submitted on ${formatDate(profile?.submittedAt)} and waiting for review.`}
              {status === "draft" && "The student hasn't submitted their profile yet."}
              {status === "changes_requested" && "Waiting for the student to update their profile."}
            </p>
            {profile?.adminRemark && <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-xs"><b>Remark:</b> {profile.adminRemark}</p>}
            {canEndorse && status !== "draft" && (
              <form className="mt-4 space-y-2">
                <textarea name="remark" rows={2} placeholder="Remark (required when requesting changes)" className="input text-xs" />
                <div className="flex flex-wrap gap-2">
                  {status !== "endorsed" && (
                    <button formAction={endorseProfile.bind(null, id)} className="btn-primary flex-1 px-4 py-2 text-xs">
                      <Check className="size-4" /> Endorse
                    </button>
                  )}
                  {status !== "changes_requested" && (
                    <button formAction={requestChanges.bind(null, id)} className="btn-outline flex-1 px-4 py-2 text-xs">
                      {status === "endorsed" ? "Revoke & request changes" : "Request changes"}
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>

          {/* Mentor */}
          <section data-tour="mentor-panel" className="card p-5">
            <h2 className="font-bold text-ink">Mentor</h2>
            {mentor ? (
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={mentor.name} size={40} />
                <div className="min-w-0">
                  <div className="truncate font-bold text-ink">{mentor.name}</div>
                  <div className="truncate text-xs text-ink/55">{mentor.email}</div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink/55">No mentor assigned.</p>
            )}
            {canAssign && (
              <form action={assignMentor.bind(null, id)} className="mt-4 flex gap-2">
                <select name="mentorId" defaultValue={mentor?.id ?? ""} aria-label="Assign mentor" className="input py-2">
                  <option value="">Unassigned</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <SubmitButton className="btn-navy px-4 py-2 text-xs" pendingText="…">Save</SubmitButton>
              </form>
            )}
          </section>

          {/* Goals */}
          <section data-tour="goals-panel" className="card p-5">
            <h2 className="font-bold text-ink">Goals</h2>
            {bundle.goals.length === 0 ? (
              <p className="mt-2 text-sm text-ink/55">No goals yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {bundle.goals.map((g) => (
                  <li key={g.id} className="flex items-center gap-2 text-sm">
                    {user.role === "hod" ? (
                      <span className={`flex size-4 items-center justify-center rounded border-2 ${g.done ? "border-teal bg-teal text-white" : "border-mist"}`}>{g.done && <Check className="size-2.5" />}</span>
                    ) : (
                      <form action={toggleGoal.bind(null, g.id)}>
                        <button aria-label="Toggle goal" className={`flex size-4 cursor-pointer items-center justify-center rounded border-2 ${g.done ? "border-teal bg-teal text-white" : "border-mist"}`}>
                          {g.done && <Check className="size-2.5" />}
                        </button>
                      </form>
                    )}
                    <span className={`flex-1 ${g.done ? "text-ink/40 line-through" : "text-ink"}`}>{g.title}</span>
                    {g.dueDate && <span className="text-[11px] text-ink/45">{formatDate(g.dueDate)}</span>}
                    {(g.createdById === user.id || user.role === "admin") && (
                      <form action={deleteGoal.bind(null, g.id)}>
                        <button aria-label="Delete goal" className="cursor-pointer p-1 text-ink/40 hover:text-ink"><Trash2 className="size-3.5" /></button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {isMentor && (
              <form action={addGoal.bind(null, id)} className="mt-4 space-y-2">
                <input name="title" required placeholder="New goal for this mentee" className="input py-2" />
                <div className="flex gap-2">
                  <input name="dueDate" type="date" aria-label="Due date" className="input py-2" />
                  <SubmitButton className="btn-navy px-3 py-2" pendingText="…"><Plus className="size-4" /></SubmitButton>
                </div>
              </form>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
