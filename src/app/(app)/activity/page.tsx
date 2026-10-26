import type { Metadata } from "next";
import { ActivityFeed } from "@/components/activity-feed";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/dal";
import { recentActivity } from "@/lib/queries";

export const metadata: Metadata = { title: "Activity log" };

export default async function ActivityPage() {
  await requireRole("admin", "hod");
  const items = await recentActivity(100);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Activity log" subtitle="Audit trail of sign-ins, profile changes, endorsements, notes and meetings (latest 100)." />
      <div data-tour="activity-log" className="card p-5 sm:p-6">
        <ActivityFeed items={items} />
      </div>
    </div>
  );
}
