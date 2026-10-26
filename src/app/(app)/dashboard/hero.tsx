import { HeroIllustration } from "@/components/illustration";

export function Hero({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section data-tour="hero" className="card relative flex items-center gap-4 overflow-hidden p-6 sm:p-8">
      <div className="relative z-10 min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <div className="mt-3 max-w-md text-sm leading-relaxed text-ink/70">{children}</div>
        {action && <div className="mt-5 flex flex-wrap gap-3">{action}</div>}
      </div>
      <HeroIllustration className="hidden w-48 shrink-0 sm:block md:w-56" />
    </section>
  );
}
