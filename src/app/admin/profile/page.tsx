import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth-actions";
import { available, listChildren, shortId } from "@/lib/domain";
import { fmtDateTime, moneyShort } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/types";
import { BRAND_TITLE } from "@/lib/brand";
import { Avatar, btnCls, StatTile } from "@/components/admin/kit";
import { ChangePasswordCard } from "@/components/admin/change-password-card";
import { IconLogout, IconUser } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminProfile() {
  const me = (await getSessionUser())!;
  const clients = listChildren(me.id);

  return (
    <div className="space-y-4">
      <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="text-brand">
            <IconUser className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl font-extrabold text-ink">Profile</h2>
        </div>

        <div className="mt-4 flex items-center gap-3.5">
          <Avatar name={me.username} className="h-14 w-14 text-xl" />
          <div className="min-w-0">
            <div className="font-display truncate text-lg font-extrabold text-ink">{me.username}</div>
            <div className="text-[12px] text-muted">
              {ROLE_LABEL[me.role]} · {BRAND_TITLE}
            </div>
            <div className="truncate text-[11px] text-muted">{shortId(me)}…</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <StatTile label="Balance" value={moneyShort(available(me))} tone="gold" />
          <StatTile label="Clients" value={clients.length} />
          <StatTile label="Since" value={new Date(me.created_at).getFullYear()} sub={fmtDateTime(me.created_at)} />
        </div>
      </section>

      <ChangePasswordCard />

      <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <h3 className="font-display text-base font-bold text-ink">Session</h3>
        <p className="mt-1 text-[12px] text-muted">
          Signing out ends this session everywhere it is open on this device.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin" className={btnCls("neutral", "px-4")}>
            Back to dashboard
          </Link>
          <form action={logoutAction}>
            <button className={btnCls("red", "px-4")}>
              <IconLogout className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
