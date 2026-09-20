"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_TABS, type AdminTab } from "./nav-items";
import {
  IconGrid,
  IconTrophy,
  IconUsers,
  IconLedger,
  IconUserCog,
  IconMegaphone,
} from "@/components/icons";

const ICONS: Record<AdminTab["key"], (p: { className?: string }) => React.ReactElement> = {
  dashboard: IconGrid,
  matches: IconTrophy,
  users: IconUsers,
  bets: IconLedger,
  "user-mgmt": IconUserCog,
  announcements: IconMegaphone,
};

export function AdminTabs() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label="Admin sections">
      {ADMIN_TABS.map((t) => {
        const active = t.exact ? path === t.href : path === t.href || path.startsWith(t.href + "/");
        const Icon = ICONS[t.key];
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
              active
                ? "card-shadow border border-line bg-panel text-brand"
                : "border border-transparent text-muted hover:bg-panel-2 hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
