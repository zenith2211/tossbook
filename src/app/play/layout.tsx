import { redirect } from "next/navigation";
import { getSessionUser, isUpline } from "@/lib/auth";
import { available } from "@/lib/domain";
import { PlayHeader } from "@/components/play/play-header";
import { SiteFooter } from "@/components/play/site-footer";
import { ToastProvider } from "@/components/play/toast";
import { BottomNav } from "@/components/bottom-nav";
import { IconCricket, IconTicket, IconBook, IconUser } from "@/components/icons";

export default async function PlayLayout({ children }: { children: React.ReactNode }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (isUpline(me.role)) redirect("/admin");
  if (me.must_change_pw) redirect("/change-password");

  const nav = [
    { href: "/play", label: "Matches", icon: <IconCricket />, exact: true },
    { href: "/play/bets", label: "Bets", icon: <IconTicket /> },
    { href: "/play/statement", label: "Passbook", icon: <IconBook /> },
    { href: "/play/account", label: "Profile", icon: <IconUser /> },
  ];

  return (
    <ToastProvider>
      <div className="mx-auto min-h-dvh max-w-2xl pb-24">
        <PlayHeader username={me.username} balance={available(me)} />
        <main className="px-3 py-4 sm:px-4">{children}</main>
        <SiteFooter />
        <BottomNav items={nav} allWidths />
      </div>
    </ToastProvider>
  );
}
