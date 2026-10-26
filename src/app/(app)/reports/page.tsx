import type { Metadata } from "next";
import { Download } from "lucide-react";
import { PageHeader, SectionHeader, Stat } from "@/components/ui";
import { requireRole } from "@/lib/dal";
import { mentorWorkload, profileStatusCounts, roleCounts, semesterDistribution } from "@/lib/queries";
import { STATUS_LABEL } from "@/lib/profile";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireRole("admin", "hod");
  const [status, roles, workload, semesters] = await Promise.all([
    profileStatusCounts(),
    roleCounts(),
    mentorWorkload(),
    semesterDistribution(),
  ]);
  const total = Object.values(status).reduce((a, b) => a + b, 0);
  const maxSem = Math.max(1, ...semesters.map((s) => s.n));
  const maxLoad = Math.max(1, ...workload.map((w) => w.mentees));
  const ratio = roles.mentor ? (roles.mentee / roles.mentor).toFixed(1) : "—";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        subtitle="Department-wide mentoring statistics."
        action={
          <a data-tour="export" href="/api/export/mentees" className="btn-outline px-4 py-2 text-xs">
            <Download className="size-4" /> Export all mentees (CSV)
          </a>
        }
      />

      <section data-tour="report-stats" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Mentees" value={roles.mentee} tone="navy" />
        <Stat label="Mentors" value={roles.mentor} tone="teal" />
        <Stat label="Mentee : mentor" value={ratio} />
        <Stat label="Endorsement rate" value={`${total ? Math.round((status.endorsed / total) * 100) : 0}%`} tone="ink" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section data-tour="report-status" className="card p-5 sm:p-6">
          <SectionHeader title="Profiles by status" />
          <ul className="space-y-3">
            {(Object.keys(status) as (keyof typeof status)[]).map((k) => (
              <li key={k}>
                <div className="mb-1 flex justify-between text-sm"><span>{STATUS_LABEL[k]}</span><b>{status[k]}</b></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${total ? (status[k] / total) * 100 : 0}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section data-tour="report-semesters" className="card p-5 sm:p-6">
          <SectionHeader title="Mentees by semester" />
          <div className="flex h-48 items-end gap-2 sm:gap-3" role="img" aria-label="Mentees per semester">
            {semesters.map((s) => (
              <div key={s.semester ?? "na"} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-bold text-ink">{s.n}</span>
                <div className="w-full rounded-t-lg bg-navy" style={{ height: `${(s.n / maxSem) * 150}px` }} />
                <span className="text-[11px] text-ink/55">{s.semester ? `S${s.semester}` : "N/A"}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section data-tour="report-workload" className="card p-5 sm:p-6">
        <SectionHeader title="Mentor workload" />
        <ul className="space-y-4">
          {workload.map((w) => (
            <li key={w.id} className="grid items-center gap-2 sm:grid-cols-[200px_1fr_auto]">
              <span className="truncate font-bold text-ink">{w.name}</span>
              <div className="h-3 overflow-hidden rounded-full bg-canvas">
                <div className="h-full rounded-full bg-teal" style={{ width: `${(w.mentees / maxLoad) * 100}%` }} />
              </div>
              <span className="text-xs text-ink/60">
                {w.mentees} mentees · {w.endorsed} endorsed · {w.notes} notes · {w.meetings} meetings
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
