import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Card, CardHead, Stat } from "@/components/ui";
import { ChangePasswordForm } from "@/components/change-password-form";
import { IconLogout } from "@/components/icons";
import { coins } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Account() {
  const me = (await getSessionUser())!;

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold">Account</h1>

      <Card>
        <div className="flex items-center gap-3 p-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-lg font-black text-ink">
            {me.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-base font-bold">{me.name}</div>
            <div className="text-xs text-muted">
              @{me.username} · {ROLE_LABEL[me.role]}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          <Stat label="Balance" value={coins(me.balance)} accent="text-gold" />
          <Stat label="Exposure" value={coins(me.exposure)} accent={me.exposure > 0 ? "text-lay" : ""} />
        </div>
      </Card>

      <Card>
        <CardHead title="Change Password" />
        <ChangePasswordForm />
      </Card>

      <Card>
        <div className="divide-y divide-line">
          <Link href="/play/statement" className="flex items-center justify-between px-4 py-3 text-sm hover:bg-ink/5">
            <span>Full Statement</span>
            <span className="text-muted">›</span>
          </Link>
          <Link href="/play/rules" className="flex items-center justify-between px-4 py-3 text-sm hover:bg-ink/5">
            <span>Rules &amp; Guidelines</span>
            <span className="text-muted">›</span>
          </Link>
          <Link href="/play/results" className="flex items-center justify-between px-4 py-3 text-sm hover:bg-ink/5">
            <span>Match Results</span>
            <span className="text-muted">›</span>
          </Link>
        </div>
      </Card>

      <form action={logoutAction}>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-bold text-danger transition hover:bg-danger/20">
          <IconLogout className="h-4 w-4" /> Sign Out
        </button>
      </form>
    </div>
  );
}
