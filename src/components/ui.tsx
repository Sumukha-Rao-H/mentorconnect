import type { ProfileStatus } from "@/db/schema";
import { initials, STATUS_LABEL } from "@/lib/profile";

export function Avatar({ name, photo, size = 40 }: { name: string; photo?: string | null; size?: number }) {
  if (photo) {
    // Photos are stored as small data URLs, so a plain <img> is the right tool.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-2 ring-white"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-label={name}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-teal font-bold text-white ring-2 ring-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

const STATUS_STYLE: Record<ProfileStatus, string> = {
  draft: "bg-mist/60 text-ink",
  submitted: "bg-navy/10 text-navy",
  endorsed: "bg-teal text-white",
  changes_requested: "bg-ink text-white",
};

export function StatusBadge({ status }: { status: ProfileStatus }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Progress({ value, label }: { value: number; label?: boolean }) {
  return (
    <div className="w-full">
      {label && <div className="mb-1 text-right text-[11px] font-bold text-navy">{value}%</div>}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-mist/60">
        <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 border-b border-mist pb-3">
      <h2 className="section-title">{title}</h2>
      {action && <div className="text-xs font-bold text-teal">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone = "white" }: { label: string; value: number | string; hint?: string; tone?: "white" | "teal" | "navy" | "ink" }) {
  const tones = {
    white: "bg-white text-ink",
    teal: "bg-teal text-white",
    navy: "bg-navy text-white",
    ink: "bg-ink text-white",
  };
  return (
    <div className={`rounded-2xl p-4 shadow-card sm:p-5 ${tones[tone]}`}>
      <div className={`text-xs font-bold uppercase tracking-wide ${tone === "white" ? "text-ink/55" : "text-white/75"}`}>{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
      {hint && <div className={`mt-1 text-xs ${tone === "white" ? "text-ink/55" : "text-white/75"}`}>{hint}</div>}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-mist px-4 py-6 text-center text-sm text-ink/55">{children}</p>;
}

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-ink/50">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-ink">{value || <span className="text-ink/35">Not provided</span>}</dd>
    </div>
  );
}

export function Chips({ value }: { value: string | null | undefined }) {
  const items = (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!items.length) return <span className="text-sm text-ink/35">Not provided</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i} className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-bold text-teal">
          {i}
        </span>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-black text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
