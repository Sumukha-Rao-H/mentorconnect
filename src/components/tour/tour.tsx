"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass, X } from "lucide-react";
import type { Role } from "@/db/schema";
import { getTourSteps, type TourStep } from "./steps";

type TourApi = { start: (index?: number) => void; active: boolean; steps: TourStep[] };

const TourCtx = createContext<TourApi | null>(null);

export function useTour() {
  const ctx = useContext(TourCtx);
  if (!ctx) throw new Error("useTour must be used inside <TourProvider>");
  return ctx;
}

// Per-viewer convenience only: remembers that this user already saw the tour.
const doneKey = (userId: number) => `mc-tour-done-${userId}`;
function readDone(userId: number) {
  try {
    return localStorage.getItem(doneKey(userId)) === "1";
  } catch {
    return true; // storage blocked: don't auto-start on every page load
  }
}
function writeDone(userId: number) {
  try {
    localStorage.setItem(doneKey(userId), "1");
  } catch {
    /* ignore */
  }
}

const SEEK_TIMEOUT_MS = 2500;
const PAD = 8;
const GAP = 14;
const EDGE = 12;

type Rect = { top: number; left: number; width: number; height: number };

function findVisible(targets: string[] | undefined): HTMLElement | null {
  for (const t of targets ?? []) {
    for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${t}"]`)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

export function TourProvider({
  role,
  userId,
  sampleMenteeId,
  children,
}: {
  role: Role;
  userId: number;
  sampleMenteeId: number | null;
  children: React.ReactNode;
}) {
  const steps = useMemo(() => getTourSteps(role, { sampleMenteeId }), [role, sampleMenteeId]);
  const [index, setIndex] = useState<number | null>(null);
  const start = useCallback((i = 0) => setIndex(Math.max(0, Math.min(i, steps.length - 1))), [steps.length]);
  const finish = useCallback(() => {
    writeDone(userId);
    setIndex(null);
  }, [userId]);

  // First visit to the dashboard: offer the tour automatically.
  const pathname = usePathname();
  const autoChecked = useRef(false);
  useEffect(() => {
    if (autoChecked.current || pathname !== "/dashboard") return;
    autoChecked.current = true;
    if (readDone(userId)) return;
    const t = setTimeout(() => setIndex((cur) => cur ?? 0), 700);
    return () => clearTimeout(t);
  }, [pathname, userId]);

  const api = useMemo(() => ({ start, active: index !== null, steps }), [start, index, steps]);

  return (
    <TourCtx.Provider value={api}>
      {children}
      {index !== null && steps[index] && (
        <TourOverlay
          key={steps[index].id + index}
          step={steps[index]}
          index={index}
          total={steps.length}
          onNext={() => (index + 1 < steps.length ? setIndex(index + 1) : finish())}
          onBack={() => setIndex(Math.max(0, index - 1))}
          onClose={finish}
        />
      )}
    </TourCtx.Provider>
  );
}

function TourOverlay({
  step,
  index,
  total,
  onNext,
  onBack,
  onClose,
}: {
  step: TourStep;
  index: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const popRef = useRef<HTMLDivElement>(null);
  // `undefined` = still looking, `null` = no anchor (centred card).
  const [rect, setRect] = useState<Rect | null | undefined>(step.targets ? undefined : null);
  const [pop, setPop] = useState<{ top: number; left: number } | null>(null);
  const [mobile, setMobile] = useState(false);
  const onPage = pathname === step.path;

  // Move to the step's page if we aren't on it.
  useEffect(() => {
    if (!onPage) router.push(step.path, { scroll: false });
  }, [onPage, router, step.path]);

  // Track the anchor every frame so scrolling, resizing and late layout shifts
  // keep the spotlight aligned. State only updates from inside the rAF callback.
  useEffect(() => {
    if (!onPage) return;
    const startedAt = performance.now();
    let scrolled = false;
    let raf = 0;
    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 640;
      setMobile((m) => (m === isMobile ? m : isMobile));

      let next: Rect | null | undefined = null;
      if (step.targets) {
        const el = findVisible(step.targets);
        if (el) {
          if (!scrolled) {
            scrolled = true;
            const h = el.getBoundingClientRect().height;
            el.scrollIntoView({ block: h > vh * 0.6 ? "start" : "center", behavior: "smooth" });
          }
          const r = el.getBoundingClientRect();
          next = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
        } else if (performance.now() - startedAt < SEEK_TIMEOUT_MS) {
          next = undefined;
        }
      }
      setRect((prev) =>
        prev === next ||
        (prev && next && Math.abs(prev.top - next.top) < 0.5 && Math.abs(prev.left - next.left) < 0.5 && prev.width === next.width && prev.height === next.height)
          ? prev
          : next,
      );

      const p = popRef.current;
      if (p && !isMobile) {
        const pw = p.offsetWidth;
        const ph = p.offsetHeight;
        let top: number;
        let left: number;
        if (next) {
          const below = next.top + next.height + GAP;
          const above = next.top - GAP - ph;
          if (below + ph <= vh - EDGE) top = below;
          else if (above >= EDGE) top = above;
          else top = vh - ph - EDGE; // tall anchor: pin the card to the bottom
          left = Math.max(EDGE, Math.min(vw - pw - EDGE, next.left + next.width / 2 - pw / 2));
        } else {
          top = (vh - ph) / 2;
          left = (vw - pw) / 2;
        }
        setPop((prev) => (prev && Math.abs(prev.top - top) < 0.5 && Math.abs(prev.left - left) < 0.5 ? prev : { top, left }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onPage, step]);

  // Keyboard controls + move focus into the card for screen readers.
  useEffect(() => {
    popRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft" && index > 0) onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onBack, onClose, onNext]);

  const seeking = rect === undefined || !onPage;
  const last = index === total - 1;

  return (
    <div className="fixed inset-0 z-[60]" aria-live="polite">
      {/* Click shield: the page is inert while the tour is open. */}
      <div className={`absolute inset-0 ${rect ? "" : "bg-ink/60"} transition-colors`} />
      {rect && (
        <div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-teal transition-all duration-300 ease-out"
          style={{ ...rect, boxShadow: "0 0 0 9999px rgb(53 53 53 / 0.6)" }}
        />
      )}

      <div
        ref={popRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        className={`absolute rounded-2xl bg-white p-5 shadow-card outline-none ${
          mobile ? "inset-x-3 bottom-3" : "w-[360px]"
        } ${seeking ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        style={mobile ? undefined : pop ? { top: pop.top, left: pop.left } : { top: -9999, left: -9999 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-teal">
            <Compass className="size-4" />
            {step.page} · {index + 1} of {total}
          </div>
          <button onClick={onClose} aria-label="Close tour" className="-m-1 cursor-pointer rounded-md p-1 text-ink/50 hover:bg-mist/50 hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        <h2 id="tour-title" className="mt-2 text-lg font-bold text-ink">{step.title}</h2>
        <p id="tour-body" className="mt-1.5 text-sm leading-relaxed text-ink/70">{step.body}</p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-mist/60">
          <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button onClick={onClose} className="btn-ghost text-xs">Skip tour</button>
          <div className="ml-auto flex gap-2">
            {index > 0 && (
              <button onClick={onBack} className="btn-outline px-4 py-2 text-xs">
                <ArrowLeft className="size-3.5" /> Back
              </button>
            )}
            <button onClick={onNext} className="btn-primary px-4 py-2 text-xs">
              {last ? "Finish" : "Next"} {!last && <ArrowRight className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TourButton({ className = "" }: { className?: string }) {
  const { start } = useTour();
  return (
    <button
      type="button"
      onClick={() => start(0)}
      data-tour="tour-button"
      aria-label="Start guided tour"
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full p-2 text-ink/60 hover:bg-mist/50 hover:text-ink sm:px-3 ${className}`}
    >
      <Compass className="size-5" />
      <span className="hidden text-sm font-bold sm:inline">Tour</span>
    </button>
  );
}

export function StartTourButton({ index = 0, children, className = "btn-primary" }: { index?: number; children: React.ReactNode; className?: string }) {
  const { start } = useTour();
  return (
    <button type="button" onClick={() => start(index)} className={className}>
      {children}
    </button>
  );
}
