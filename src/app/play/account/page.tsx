import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth-actions";
import { available, listBetsForUser } from "@/lib/domain";
import { coins } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { ProfileSettings } from "@/components/play/profile-settings";
import { StatTile } from "@/components/admin/kit";
import { IconCheckCircle, IconEdit, IconLogout } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function Account() {
  const me = (await getSessionUser())!;
  const picks = listBetsForUser(me.id, 500);

  return (
    <div className="space-y-4">
      {/* Identity */}
      <section className="flex flex-col items-center pt-2 text-center">
        <span className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#26354a] to-[#0f1825] shadow-lg shadow-black/20 ring-4 ring-gold/30">
          <span className="font-display text-2xl font-extrabold text-gold">{BRAND.prefix}</span>
          <span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border-4 border-[color:var(--color-surface)] bg-brand text-white">
            <IconEdit className="h-3.5 w-3.5" />
          </span>
        </span>

        <h1 className="font-display mt-3 text-2xl font-extrabold capitalize text-ink">{me.name}</h1>
        <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600">
          <IconCheckCircle className="h-4 w-4" />
          {me.status === "active" ? "Active account" : "Account locked"}
        </p>
        <p className="text-[12px] text-muted">@{me.username}</p>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Balance" value={coins(available(me))} tone="brand" />
        <StatTile label="Exposure" value={coins(me.exposure)} tone={me.exposure > 0 ? "lay" : "ink"} />
        <StatTile label="Picks" value={picks.length} />
      </div>

      <ProfileSettings />

      <form action={logoutAction}>
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-lay/35 bg-lay/5 px-4 py-3.5 text-sm font-bold text-lay transition hover:bg-lay/10">
          <IconLogout className="h-4 w-4" /> Sign out
        </button>
      </form>
    </div>
  );
}
