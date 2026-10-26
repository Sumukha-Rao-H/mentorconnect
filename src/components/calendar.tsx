"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

// `events` are ISO date strings (yyyy-mm-dd, IST) that get a dot under the day.
export function Calendar({ events = [], today }: { events?: string[]; today: string }) {
  const [ty, tm] = today.split("-").map(Number) as [number, number];
  const [cursor, setCursor] = useState({ y: ty, m: tm - 1 });
  const marked = useMemo(() => new Set(events), [events]);

  const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7; // Monday-first grid
  const prevDays = new Date(Date.UTC(cursor.y, cursor.m, 0)).getUTCDate();
  const cells: { day: number; muted: boolean; iso?: string }[] = [];
  for (let i = offset - 1; i >= 0; i--) cells.push({ day: prevDays - i, muted: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, muted: false, iso });
  }
  while (cells.length % 7) cells.push({ day: cells.length - offset - daysInMonth + 1, muted: true });

  const move = (delta: number) =>
    setCursor(({ y, m }) => {
      const n = m + delta;
      return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 };
    });

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => move(-1)} aria-label="Previous month" className="cursor-pointer rounded-md p-1 text-ink/60 hover:bg-mist/50">
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-bold text-ink">
          {first.toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })}
        </span>
        <button onClick={() => move(1)} aria-label="Next month" className="cursor-pointer rounded-md p-1 text-ink/60 hover:bg-mist/50">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 border-b border-mist pb-2 text-center text-[10px] font-bold text-ink/45">
        {DAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-xs">
        {cells.map((c, i) => {
          const isToday = c.iso === today;
          const has = c.iso && marked.has(c.iso);
          return (
            <span key={i} className="flex flex-col items-center">
              <span
                className={`flex size-7 items-center justify-center rounded-full font-bold ${
                  c.muted ? "text-ink/25" : isToday ? "bg-navy text-white" : "text-ink"
                }`}
              >
                {c.day}
              </span>
              <span className={`mt-0.5 size-1 rounded-full ${has ? "bg-teal" : "bg-transparent"}`} />
            </span>
          );
        })}
      </div>
    </div>
  );
}
