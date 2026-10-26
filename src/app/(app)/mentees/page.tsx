import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { Avatar, EmptyState, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/dal";
import { profileCompletion, STATUS_LABEL } from "@/lib/profile";
import { listMentees, listMentors } from "@/lib/queries";

export const metadata: Metadata = { title: "Mentees" };

export default async function MenteesPage(props: PageProps<"/mentees">) {
  const user = await requireRole("mentor", "admin", "hod");
  const sp = await props.searchParams;
  const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = str(sp.q).trim();
  const status = str(sp.status);
  const semester = str(sp.semester);
  const mentorFilter = str(sp.mentor);
  const isStaffWide = user.role !== "mentor";

  const [rows, mentors] = await Promise.all([
    listMentees({
      q: q || undefined,
      status: status || undefined,
      semester: semester || undefined,
      // Mentors are always scoped to their own mentees, whatever the URL says.
      mentorId: user.role === "mentor" ? user.id : mentorFilter && mentorFilter !== "none" ? Number(mentorFilter) : undefined,
      unassigned: isStaffWide && mentorFilter === "none",
    }),
    isStaffWide ? listMentors() : Promise.resolve([]),
  ]);
  const exportQuery = new URLSearchParams({ q, status, semester, mentor: mentorFilter }).toString();

  return (
    <div>
      <PageHeader
        title={user.role === "mentor" ? "My Mentees" : "All Mentees"}
        subtitle={`${rows.length} student${rows.length === 1 ? "" : "s"}${q ? ` matching “${q}”` : ""}`}
        action={
          isStaffWide && (
            <a href={`/api/export/mentees?${exportQuery}`} className="btn-outline px-4 py-2 text-xs">
              <Download className="size-4" /> Export CSV
            </a>
          )
        }
      />

      <form className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <input name="q" defaultValue={q} placeholder="Name, USN or email" aria-label="Search" className="input" />
        <select name="status" defaultValue={status} aria-label="Status" className="input">
          <option value="">Any status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select name="semester" defaultValue={semester} aria-label="Semester" className="input">
          <option value="">Any semester</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
        {isStaffWide ? (
          <select name="mentor" defaultValue={mentorFilter} aria-label="Mentor" className="input">
            <option value="">Any mentor</option>
            <option value="none">Unassigned</option>
            {mentors.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        ) : (
          <span className="hidden lg:block" />
        )}
        <div className="flex gap-2">
          <button className="btn-primary flex-1">Filter</button>
          <Link href="/mentees" className="btn-ghost">Clear</Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState>No mentees match these filters.</EmptyState>
      ) : (
        <>
          {/* Cards on small screens */}
          <ul className="grid gap-3 sm:grid-cols-2 md:hidden">
            {rows.map((m) => (
              <li key={m.id}>
                <Link href={`/mentees/${m.id}`} className="card flex items-center gap-3 p-4">
                  <Avatar name={m.name} photo={m.profile?.photo} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-ink">{m.name}</div>
                    <div className="text-xs text-ink/50">{m.profile?.usn ?? "—"} · Sem {m.profile?.semester ?? "—"}</div>
                    <div className="mt-1.5"><StatusBadge status={m.profile?.status ?? "draft"} /></div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Table on larger screens */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-mist text-xs uppercase tracking-wide text-ink/55">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">USN</th>
                  <th className="px-5 py-3">Sem</th>
                  {isStaffWide && <th className="px-5 py-3">Mentor</th>}
                  <th className="px-5 py-3">Profile</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {rows.map((m) => (
                  <tr key={m.id} className="hover:bg-canvas">
                    <td className="px-5 py-3">
                      <Link href={`/mentees/${m.id}`} className="flex items-center gap-3 font-bold text-ink hover:text-teal">
                        <Avatar name={m.name} photo={m.profile?.photo} size={34} />
                        <span>
                          {m.name}
                          <span className="block text-xs font-normal text-ink/50">{m.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{m.profile?.usn ?? "—"}</td>
                    <td className="px-5 py-3">{m.profile?.semester ?? "—"}</td>
                    {isStaffWide && <td className="px-5 py-3">{m.mentorName ?? <span className="text-ink/40">Unassigned</span>}</td>}
                    <td className="w-36 px-5 py-3"><Progress value={profileCompletion(m.profile)} label /></td>
                    <td className="px-5 py-3"><StatusBadge status={m.profile?.status ?? "draft"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
