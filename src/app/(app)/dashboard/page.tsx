import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { MenteeDashboard } from "./mentee-dashboard";
import { MentorDashboard } from "./mentor-dashboard";
import { AdminDashboard } from "./admin-dashboard";
import { HodDashboard } from "./hod-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const user = await requireUser();
  const { denied } = await props.searchParams;
  return (
    <>
      {denied && (
        <p role="alert" className="mb-6 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white">
          That page isn&apos;t available for your role, so you were brought back home.
        </p>
      )}
      {user.role === "mentee" && <MenteeDashboard user={user} />}
      {user.role === "mentor" && <MentorDashboard user={user} />}
      {user.role === "admin" && <AdminDashboard user={user} />}
      {user.role === "hod" && <HodDashboard user={user} />}
    </>
  );
}
