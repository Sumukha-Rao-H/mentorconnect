import { GraduationCap, ShieldCheck, NotebookPen, Eye } from "lucide-react";
import { HeroIllustration } from "@/components/illustration";

const FEATURES = [
  { icon: GraduationCap, text: "Mentees keep one complete, up-to-date profile" },
  { icon: NotebookPen, text: "Mentors add notes, recommendations, goals and meetings" },
  { icon: ShieldCheck, text: "Administrators endorse profiles and assign mentors" },
  { icon: Eye, text: "The HOD gets a department-wide view" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-card lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between bg-navy p-10 text-white lg:flex">
          <div className="flex items-center overflow-hidden rounded-lg bg-ink/40 self-start">
            <span className="flex size-10 items-center justify-center bg-teal">
              <GraduationCap className="size-5" />
            </span>
            <span className="px-4 font-bold tracking-wide">MentorConnect</span>
          </div>
          <div>
            <div className="mx-auto max-w-xs rounded-3xl bg-white p-4">
              <HeroIllustration className="w-full" />
            </div>
            <h2 className="mt-8 text-2xl font-black">Mentoring, organised.</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/85">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-mist" /> {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-white/60">Department of Information Science &amp; Engineering</p>
        </section>
        <section className="p-6 sm:p-10">{children}</section>
      </div>
    </div>
  );
}
