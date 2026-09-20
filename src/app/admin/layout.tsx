import { redirect } from "next/navigation";
import { getSessionUser, isUpline } from "@/lib/auth";
import { available, listAnnouncements } from "@/lib/domain";
import { ROLE_LABEL } from "@/lib/types";
import { BRAND_TITLE } from "@/lib/brand";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { ADMIN_TABS } from "@/components/admin/nav-items";
import { Ticker } from "@/components/admin/ticker";
import { IconTile } from "@/components/admin/kit";
import { BottomNav, type NavItem } from "@/components/bottom-nav";
import { IconShield, IconCricket, IconTicket, IconBook, IconUser } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!isUpline(me.role)) redirect("/play");

  const announcements = listAnnouncements(true);

  const bottomNav: NavItem[] = [
    { href: "/admin/matches", label: "Matches", icon: <IconCricket /> },
    { href: "/admin/bets", label: "Bets", icon: <IconTicket /> },
    { href: "/admin/passbook", label: "Passbook", icon: <IconBook /> },
    { href: "/admin/profile", label: "Profile", icon: <IconUser /> },
  ];

  return (
    <div className="theme-light min-h-dvh pb-24">
      <AdminHeader
        username={me.username}
        balance={available(me)}
        roleLabel={ROLE_LABEL[me.role]}
        menu={ADMIN_TABS.map((t) => ({ href: t.href, label: t.label }))}
      />

      <Ticker items={announcements} />

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4">
        <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <IconTile tone="brand">
              <IconShield className="h-[18px] w-[18px]" />
            </IconTile>
            <div>
              <h1 className="font-display text-xl font-extrabold leading-tight text-ink">Admin Panel</h1>
              <p className="text-xs text-muted">{BRAND_TITLE} — Management</p>
            </div>
          </div>

          <div className="mt-4">
            <AdminTabs />
          </div>
        </section>

        <main className="mt-4 space-y-4">{children}</main>
      </div>

      <BottomNav items={bottomNav} allWidths />
    </div>
  );
}
