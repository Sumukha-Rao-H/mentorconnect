// Flat "learner at laptop" illustration in the app palette, echoing the hero
// art in the reference design without shipping an external image.
export function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 160" className={className} aria-hidden="true">
      <ellipse cx="120" cy="146" rx="90" ry="8" fill="#d9d9d9" />
      <rect x="22" y="30" width="56" height="34" rx="6" fill="#d9d9d9" />
      <rect x="30" y="40" width="34" height="4" rx="2" fill="#ffffff" />
      <rect x="30" y="49" width="24" height="4" rx="2" fill="#ffffff" />
      <path d="M40 64 l6 8 l4 -8z" fill="#d9d9d9" />
      <rect x="160" y="40" width="34" height="28" rx="6" fill="#ffffff" stroke="#3c6e71" strokeWidth="2" />
      <path d="M170 56 l5 5 l10 -12" stroke="#3c6e71" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="118" cy="22" r="9" fill="#ffffff" stroke="#353535" strokeWidth="2" />
      <path d="M118 6v-4M104 12l-3-3M132 12l3-3M100 24h-4M140 24h-4" stroke="#3c6e71" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M114 32h8" stroke="#353535" strokeWidth="2" />
      <path d="M98 140c0-30 6-52 26-52s26 22 26 52z" fill="#284b63" />
      <circle cx="124" cy="68" r="15" fill="#f1d3bd" />
      <path d="M108 64c0-14 10-20 18-20 10 0 16 8 14 18-6-6-14-6-20-10-4 6-8 10-12 12z" fill="#353535" />
      <path d="M146 100c10-6 16-16 14-30" stroke="#284b63" strokeWidth="10" strokeLinecap="round" fill="none" />
      <circle cx="160" cy="68" r="5" fill="#f1d3bd" />
      <rect x="74" y="112" width="58" height="34" rx="4" fill="#353535" />
      <rect x="64" y="144" width="80" height="5" rx="2.5" fill="#353535" />
      <circle cx="103" cy="129" r="4" fill="#3c6e71" />
    </svg>
  );
}
