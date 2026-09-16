import { redirect } from "next/navigation";
import { getSessionUser, isUpline } from "@/lib/auth";
import { available } from "@/lib/domain";
import { logoutAction } from "@/lib/actions/auth-actions";
import { coins } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/types";
import { Logo, Badge } from "@/components/ui";
import { BottomNav, SideNav, type NavItem } from "@/components/bottom-nav";
import {
  IconChart,
  IconUsers,
  IconCricket,
  IconLedger,
  IconCash,
  IconLogout,
} from "@/components/icons";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!isUpline(me.role)) redirect("/play");

  const nav: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: <IconChart />, exact: true },
    { href: "/admin/users", label: "Clients", icon: <IconUsers /> },
    { href: "/admin/matches", label: "Matches", icon: <IconCricket /> },
    { href: "/admin/bets", label: "Bets", icon: <IconLedger /> },
    { href: "/admin/reports", label: "Reports", icon: <IconChart /> },
    { href: "/admin/statement", label: "Ledger", icon: <IconCash /> },
  ];

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-panel/50 p-4 md:flex">
        <div className="mb-6">
          <Logo />
        </div>
        <SideNav items={nav} />
        <div className="mt-auto space-y-3 pt-4">
          <div className="rounded-xl border border-line bg-panel-2 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted">My Balance</div>
            <div className="text-lg font-bold text-gold">{coins(available(me))}</div>
          </div>
          <form action={logoutAction}>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted hover:text-ink">
              <IconLogout className="h-4 w-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 pb-20 md:pb-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-panel/80 px-4 py-2.5 backdrop-blur">
          <div className="md:hidden">
            <Logo size="sm" />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-sm font-semibold text-ink/80">{me.name}</span>
            <Badge tone="brand">{ROLE_LABEL[me.role]}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-right">
              <div className="text-[9px] uppercase tracking-wider text-muted">Balance</div>
              <div className="text-sm font-bold tabular-nums text-gold">{coins(available(me))}</div>
            </div>
            <form action={logoutAction} className="md:hidden">
              <button className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:text-ink" aria-label="Sign out">
                <IconLogout className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
      </div>

      <BottomNav items={nav} />
    </div>
  );
}
