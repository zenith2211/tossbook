import { redirect } from "next/navigation";
import { getSessionUser, isUpline } from "@/lib/auth";
import { available } from "@/lib/domain";
import { coins } from "@/lib/format";
import { Logo } from "@/components/ui";
import { BottomNav } from "@/components/bottom-nav";
import { IconHome, IconTicket, IconBook, IconUser } from "@/components/icons";
import Link from "next/link";

export default async function PlayLayout({ children }: { children: React.ReactNode }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (isUpline(me.role)) redirect("/admin");
  if (me.must_change_pw) redirect("/change-password");

  const avail = available(me);

  const nav = [
    { href: "/play", label: "Arena", icon: <IconHome />, exact: true },
    { href: "/play/bets", label: "My Bets", icon: <IconTicket /> },
    { href: "/play/statement", label: "Passbook", icon: <IconBook /> },
    { href: "/play/account", label: "Account", icon: <IconUser /> },
  ];

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-20">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/70 px-4 py-2.5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <Link href="/play/rules" className="hidden text-xs font-semibold text-muted hover:text-ink sm:block">
              Rules
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-brand/25 bg-arena px-3 py-1.5 text-right">
              <div className="text-[9px] uppercase tracking-wider text-muted">Balance</div>
              <div className="text-sm font-black tabular-nums text-gold">{coins(avail)}</div>
            </div>
            {me.exposure > 0 ? (
              <div className="rounded-xl border border-lay/30 bg-lay/10 px-3 py-1.5 text-right">
                <div className="text-[9px] uppercase tracking-wider text-lay/80">Exposure</div>
                <div className="text-sm font-black tabular-nums text-lay">{coins(me.exposure)}</div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="px-4 py-4">{children}</main>

      <BottomNav items={nav} allWidths />
    </div>
  );
}
