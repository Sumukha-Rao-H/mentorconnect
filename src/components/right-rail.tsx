import Link from "next/link";
import { Calendar } from "./calendar";
import { todayIST } from "@/lib/queries";

export type RailTask = { id: string; label: string; meta?: string; href?: string; tone: "teal" | "navy" | "ink" | "mist" };

const DOT = { teal: "bg-teal", navy: "bg-navy", ink: "bg-ink", mist: "bg-mist" };

// Right-hand column from the reference layout: calendar, today's list, callout.
export function RightRail({
  events,
  tasksTitle,
  tasks,
  taskAction,
  callout,
}: {
  events: string[];
  tasksTitle: string;
  tasks: RailTask[];
  taskAction?: React.ReactNode;
  callout?: React.ReactNode;
}) {
  return (
    <aside className="space-y-6 xl:w-80 xl:shrink-0">
      <Calendar events={events} today={todayIST()} />
      <div>
        <h3 className="border-b border-mist pb-3 text-center font-bold text-ink">{tasksTitle}</h3>
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/50">Nothing scheduled. Enjoy the calm.</p>
        ) : (
          <ul className="mt-2">
            {tasks.map((t, i) => {
              const inner = (
                <>
                  <span className={`size-2 shrink-0 rounded-full ${DOT[t.tone]}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{t.label}</span>
                    {t.meta && <span className="block truncate text-xs text-ink/50">{t.meta}</span>}
                  </span>
                </>
              );
              const cls = `flex items-center gap-3 px-3 py-3 ${i === 0 ? "border-l-4 border-navy bg-canvas" : "border-l-4 border-transparent"}`;
              return (
                <li key={t.id}>
                  {t.href ? (
                    <Link href={t.href} className={`${cls} hover:bg-canvas`}>
                      {inner}
                    </Link>
                  ) : (
                    <div className={cls}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {taskAction && <div className="mt-3 flex justify-center">{taskAction}</div>}
      </div>
      {callout}
    </aside>
  );
}
