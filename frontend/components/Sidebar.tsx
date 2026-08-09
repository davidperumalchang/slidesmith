"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  HomeIcon,
  MusicIcon,
  BookIcon,
  SlidesIcon,
  ProjectorIcon,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
};

type NavGroup = { title?: string; items: NavItem[] };

const groups: NavGroup[] = [
  { items: [{ href: "/", label: "Home", icon: HomeIcon }] },
  {
    title: "PowerPoint",
    items: [
      { href: "/lyrics-ppt", label: "Lyrics Slides", icon: MusicIcon },
      { href: "/sermon-ppt", label: "Sermon Slides", icon: BookIcon },
    ],
  },
  {
    title: "ProPresenter 7",
    items: [
      { href: "/lyrics-pp7", label: "Lyrics .pro", icon: SlidesIcon },
      { href: "/sermon-pp7", label: "Sermon .pro", icon: ProjectorIcon },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-6">
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.title && (
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </p>
          )}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v9A1.5 1.5 0 0118.5 16H14l-2 3-2-3H5.5A1.5 1.5 0 014 14.5v-9z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900">
        Slide<span className="text-brand-600">Smith</span>
      </span>
    </Link>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <Brand />
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 space-y-8 bg-white p-5 shadow-xl">
            <Brand />
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r border-slate-200 bg-white p-5 md:flex">
        <Brand />
        <NavLinks />
        <div className="mt-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">SlideSmith</p>
          <p className="mt-0.5">PowerPoint &amp; ProPresenter 7 generator for church services.</p>
        </div>
      </aside>

      {/* Spacer for mobile fixed top bar */}
      <div className="h-14 md:hidden" aria-hidden />
    </>
  );
}
