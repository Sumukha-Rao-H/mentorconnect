import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { menteeProfiles } from "@/db/schema";
import { PageHeader, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/dal";
import { profileCompletion } from "@/lib/profile";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage(props: PageProps<"/profile">) {
  const user = await requireRole("mentee");
  const { welcome } = await props.searchParams;
  const [profile] = await db.select().from(menteeProfiles).where(eq(menteeProfiles.userId, user.id));
  const pct = profileCompletion(profile);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="My Profile"
        subtitle="Your mentor sees this information. The administrator endorses it once you submit."
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={profile?.status ?? "draft"} />
            <span className="text-sm font-bold text-navy">{pct}% complete</span>
          </div>
        }
      />
      {welcome && (
        <p className="mb-6 rounded-xl bg-teal/10 px-4 py-3 text-sm font-bold text-teal">
          Welcome aboard! Start by filling in your details below.
        </p>
      )}
      {profile?.status === "changes_requested" && profile.adminRemark && (
        <p className="mb-6 rounded-xl bg-ink px-4 py-3 text-sm text-white">
          <b>Changes requested:</b> {profile.adminRemark}
        </p>
      )}
      {profile?.status === "endorsed" && (
        <p className="mb-6 rounded-xl bg-canvas px-4 py-3 text-sm text-ink/70">
          Your profile is endorsed. Saving changes sends it back to draft for re-endorsement.
        </p>
      )}
      <ProfileForm profile={profile ?? null} name={user.name} status={profile?.status ?? "draft"} completion={pct} />
    </div>
  );
}
