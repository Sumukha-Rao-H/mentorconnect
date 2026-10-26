import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { endorseProfile } from "@/app/actions/admin";
import { SubmitButton } from "@/components/forms";
import { Avatar, Chips, EmptyState, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/dal";
import { formatDate, profileCompletion } from "@/lib/profile";
import { listMentees } from "@/lib/queries";

export const metadata: Metadata = { title: "Endorsements" };

export default async function EndorsementsPage() {
  await requireRole("admin");
  const [pending, changes, endorsed] = await Promise.all([
    listMentees({ status: "submitted" }),
    listMentees({ status: "changes_requested" }),
    listMentees({ status: "endorsed" }),
  ]);

  return (
    <div>
      <PageHeader title="Endorsements" subtitle="Verify submitted mentee profiles. Endorse them, or send them back with a remark." />

      <div data-tour="endorse-queue">
      <h2 className="section-title mb-3">Awaiting review ({pending.length})</h2>
      {pending.length === 0 ? (
        <EmptyState>Nothing to review right now.</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pending.map((m) => (
            <article key={m.id} className="card flex flex-col p-5">
              <div className="flex items-center gap-3">
                <Avatar name={m.name} photo={m.profile?.photo} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-ink">{m.name}</div>
                  <div className="text-xs text-ink/55">
                    {m.profile?.usn} · Sem {m.profile?.semester} · Mentor: {m.mentorName ?? "unassigned"}
                  </div>
                </div>
                <StatusBadge status="submitted" />
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><div className="label">Skills</div><Chips value={m.profile?.skills} /></div>
                <div><div className="label">Hobbies</div><Chips value={m.profile?.hobbies} /></div>
              </div>
              <div className="mt-4"><Progress value={profileCompletion(m.profile)} label /></div>
              <p className="mt-2 text-xs text-ink/50">Submitted {formatDate(m.profile?.submittedAt, true)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={endorseProfile.bind(null, m.id)}>
                  <SubmitButton className="btn-primary px-4 py-2 text-xs" pendingText="Endorsing…">
                    <Check className="size-4" /> Quick endorse
                  </SubmitButton>
                </form>
                <Link href={`/mentees/${m.id}#endorsement`} className="btn-outline px-4 py-2 text-xs">Review in full</Link>
              </div>
            </article>
          ))}
        </div>
      )}
      </div>

      <div data-tour="endorse-history" className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="section-title mb-3">Changes requested ({changes.length})</h2>
          <ul className="card divide-y divide-mist">
            {changes.length === 0 && <li className="p-4 text-sm text-ink/50">None.</li>}
            {changes.map((m) => (
              <li key={m.id}>
                <Link href={`/mentees/${m.id}`} className="flex items-center gap-3 p-4 hover:bg-canvas">
                  <Avatar name={m.name} photo={m.profile?.photo} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{m.name}</div>
                    <div className="truncate text-xs text-ink/50">{m.profile?.adminRemark}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="section-title mb-3">Endorsed ({endorsed.length})</h2>
          <ul className="card divide-y divide-mist">
            {endorsed.length === 0 && <li className="p-4 text-sm text-ink/50">None yet.</li>}
            {endorsed.map((m) => (
              <li key={m.id}>
                <Link href={`/mentees/${m.id}`} className="flex items-center gap-3 p-4 hover:bg-canvas">
                  <Avatar name={m.name} photo={m.profile?.photo} size={32} />
                  <div className="min-w-0 flex-1 truncate text-sm font-bold">{m.name}</div>
                  <span className="text-xs text-ink/50">{formatDate(m.profile?.endorsedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
