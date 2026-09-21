"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string; icon: ReactNode; exact?: boolean };

export function BottomNav({ items, allWidths = false }: { items: NavItem[]; allWidths?: boolean }) {
  const path = usePathname();
  return (
    <nav
      className={`glass fixed inset-x-0 bottom-0 z-30 border-t border-line shadow-[0_-8px_30px_rgba(0,0,0,0.18)] ${allWidths ? "" : "md:hidden"}`}
    >
      <div className="mx-auto flex max-w-2xl items-stretch">
        {items.map((it) => {
          const active = it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition ${
                active ? "text-brand" : "text-muted hover:text-ink/80"
              }`}
            >
              {active ? <span className="absolute top-0 h-0.5 w-10 rounded-full bg-brand shadow-[0_0_10px_rgba(23,201,180,0.7)]" /> : null}
              <span className={active ? "scale-110 drop-shadow-[0_0_8px_rgba(23,201,180,0.5)] transition" : "transition"}>{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SideNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="hidden md:flex md:flex-col md:gap-1">
      {items.map((it) => {
        const active = it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-brand/10 text-brand" : "text-muted hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {it.icon}
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
