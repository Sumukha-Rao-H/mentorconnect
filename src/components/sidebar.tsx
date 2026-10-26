"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  History,
  Home,
  LogOut,
  Menu,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { Role } from "@/db/schema";
import { logout } from "@/app/actions/auth";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: Role[] };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home, roles: ["mentee", "mentor", "admin", "hod"] },
  { href: "/profile", label: "My Profile", icon: UserRound, roles: ["mentee"] },
  { href: "/mentees", label: "Mentees", icon: GraduationCap, roles: ["mentor", "admin", "hod"] },
  { href: "/endorsements", label: "Endorsements", icon: ClipboardCheck, roles: ["admin"] },
  { href: "/meetings", label: "Meetings", icon: CalendarDays, roles: ["mentee", "mentor", "admin", "hod"] },
  { href: "/reports", label: "Reports", icon: FileBarChart, roles: ["admin", "hod"] },
  { href: "/users", label: "Users", icon: Users, roles: ["admin"] },
  { href: "/activity", label: "Activity Log", icon: History, roles: ["admin", "hod"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["mentee", "mentor", "admin", "hod"] },
];

function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.filter((n) => n.roles.includes(role)).map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition ${
              active ? "bg-white font-bold text-navy" : "text-white/85 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="size-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center overflow-hidden rounded-lg bg-ink/40">
      <span className="flex size-10 items-center justify-center bg-teal">
        <GraduationCap className="size-5 text-white" />
      </span>
      <span className="px-4 text-base font-bold tracking-wide text-white">MentorConnect</span>
    </div>
  );
}

function Footer({ footer }: { footer: React.ReactNode }) {
  return (
    <div className="mt-auto space-y-4 pt-8">
      {footer}
      <form action={logout}>
        <button className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-[15px] text-white/85 hover:bg-white/10 hover:text-white">
          <LogOut className="size-5" /> Sign out
        </button>
      </form>
    </div>
  );
}

export function Sidebar({ role, footer }: { role: Role; footer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy px-5 py-8 lg:flex">
        <Brand />
        <div className="mt-10">
          <NavLinks role={role} />
        </div>
        <Footer footer={footer} />
      </aside>

      {/* Mobile header + drawer */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 lg:hidden">
        <Brand />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="cursor-pointer rounded-lg p-2 text-white hover:bg-white/10"
        >
          <Menu className="size-6" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button aria-label="Close menu" className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-navy px-5 py-6">
            <div className="flex items-center justify-between">
              <Brand />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="cursor-pointer p-2 text-white">
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-8">
              <NavLinks role={role} onNavigate={() => setOpen(false)} />
            </div>
            <Footer footer={footer} />
          </aside>
        </div>
      )}
    </>
  );
}
