import type { Metadata } from "next";
import { Check, Compass, PlayCircle } from "lucide-react";
import { getTourSteps } from "@/components/tour/steps";
import { StartTourButton } from "@/components/tour/tour";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { tourSampleMentee } from "@/lib/queries";
import { PERMISSIONS, ROLE_LABEL, type Permission } from "@/lib/rbac";

export const metadata: Metadata = { title: "Help & Tour" };

const PERMISSION_LABEL: Record<Permission, string> = {
  "profile:edit-own": "Edit your own mentee profile",
  "mentee:view-assigned": "View your assigned mentees",
  "mentee:view-all": "View every mentee in the department",
  "note:create": "Write recommendations and notes",
  "note:view-private": "Read private staff notes",
  "goal:create": "Create goals",
  "meeting:schedule": "Schedule and complete meetings",
  "profile:endorse": "Endorse profiles or request changes",
  "mentor:assign": "Assign mentors to mentees",
  "user:manage": "Create users and change roles",
  "audit:view": "View the activity log",
  "report:view": "View reports and export CSV",
};

export default async function HelpPage() {
  const user = await requireUser();
  const steps = getTourSteps(user.role, { sampleMenteeId: await tourSampleMentee(user) });

  // Group consecutive steps by page, remembering where each group starts.
  const groups: { page: string; start: number; items: typeof steps }[] = [];
  steps.forEach((s, i) => {
    const last = groups.at(-1);
    if (last && last.page === s.page) last.items.push(s);
    else groups.push({ page: s.page, start: i, items: [s] });
  });
  const allowed = (Object.keys(PERMISSIONS) as Permission[]).filter((p) =>
    (PERMISSIONS[p] as readonly string[]).includes(user.role),
  );

  return (
    <div className="mx-auto max-w-5xl" data-tour="help-page">
      <PageHeader
        title="Help & Tour"
        subtitle={`Everything you can do as ${ROLE_LABEL[user.role]}, page by page.`}
        action={
          <StartTourButton>
            <PlayCircle className="size-4" /> Start the full tour
          </StartTourButton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.page + g.start} className="card p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="section-title">{g.page}</h2>
                <StartTourButton index={g.start} className="btn-outline px-4 py-1.5 text-xs">
                  <Compass className="size-3.5" /> Show me
                </StartTourButton>
              </div>
              <dl className="divide-y divide-mist">
                {g.items.map((s) => (
                  <div key={s.id} className="py-3">
                    <dt className="font-bold text-ink">{s.title}</dt>
                    <dd className="mt-0.5 text-sm text-ink/65">{s.body}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-navy p-5 text-white lg:sticky lg:top-6">
            <h2 className="font-bold">Your permissions</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/85">
              {allowed.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-mist" /> {PERMISSION_LABEL[p]}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-white/60">Need something else? Ask your department administrator.</p>
          </div>
          <div className="card p-5 text-sm text-ink/70">
            <h2 className="mb-2 font-bold text-ink">Keyboard shortcuts</h2>
            <ul className="space-y-1.5">
              <li><kbd className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs">→</kbd> next step</li>
              <li><kbd className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs">←</kbd> previous step</li>
              <li><kbd className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs">Esc</kbd> close the tour</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
