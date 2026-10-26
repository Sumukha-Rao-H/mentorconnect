import type { recentActivity } from "@/lib/queries";
import { formatDate } from "@/lib/profile";
import { ROLE_LABEL } from "@/lib/rbac";

type Item = Awaited<ReturnType<typeof recentActivity>>[number];

const TONE: Record<string, string> = {
  profile: "bg-teal",
  note: "bg-navy",
  recommendation: "bg-navy",
  meeting: "bg-teal",
  mentor: "bg-ink",
  user: "bg-ink",
  auth: "bg-mist",
};

export function ActivityFeed({ items, compact = false }: { items: Item[]; compact?: boolean }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-ink/50">No activity yet.</p>;
  return (
    <ol className="mt-3 space-y-3">
      {items.map(({ log, actorName, actorRole }) => (
        <li key={log.id} className="flex gap-3">
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${TONE[log.action.split(".")[0]!] ?? "bg-mist"}`} />
          <div className="min-w-0 flex-1">
            <p className={`text-sm text-ink ${compact ? "line-clamp-2" : ""}`}>{log.details ?? log.action}</p>
            <p className="text-[11px] text-ink/50">
              {actorName ?? "System"}
              {actorRole && !compact ? ` (${ROLE_LABEL[actorRole]})` : ""} · {formatDate(log.createdAt, true)}
              {!compact && <span className="ml-2 rounded bg-canvas px-1.5 py-0.5 font-mono">{log.action}</span>}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
