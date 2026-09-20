import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { available, bookPnL, listChildren, listMatchOverviews, totalExposure } from "@/lib/domain";
import { coins, fmtDateTime, moneyShort, signed } from "@/lib/format";
import { PHASE_TONE } from "@/components/admin/match-view";
import { StatTile, EmptyState, btnCls, Avatar } from "@/components/admin/kit";
import {
  IconDot,
  IconGrid,
  IconMegaphone,
  IconPlus,
  IconTrophy,
  IconUserPlus,
  IconUsers,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const me = (await getSessionUser())!;
  const clients = listChildren(me.id);
  const clientIds = clients.map((c) => c.id);
  const overviews = listMatchOverviews();

  const openBets = clientIds.length
    ? (
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM bets WHERE status='open' AND user_id IN (${clientIds.map(() => "?").join(",")})`,
          )
          .get(...clientIds) as { n: number }
      ).n
    : 0;

  const pl = bookPnL(clientIds);
  const liveCount = overviews.filter((o) => o.phase === "live").length;
  const awaiting = overviews.filter((o) => o.phase === "closed" && o.market?.status !== "settled");
  const recent = overviews.slice(0, 5);
  const topClients = [...clients].sort((a, b) => b.balance - a.balance).slice(0, 5);

  const quick = [
    { href: "/admin/matches", label: "New match", icon: <IconPlus className="h-4 w-4" /> },
    { href: "/admin/user-mgmt", label: "Add user", icon: <IconUserPlus className="h-4 w-4" /> },
    { href: "/admin/announcements", label: "Announce", icon: <IconMegaphone className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="text-brand">
            <IconGrid className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl font-extrabold text-ink">Dashboard</h2>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatTile label="My balance" value={moneyShort(available(me))} tone="gold" />
          <StatTile label="Book P&L" value={signed(pl)} tone={pl >= 0 ? "brand" : "lay"} />
          <StatTile label="Live exposure" value={coins(totalExposure(clientIds))} tone="lay" />
          <StatTile label="Open bets" value={openBets} sub={`${liveCount} match${liveCount === 1 ? "" : "es"} live`} />
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2">
          {quick.map((q) => (
            <Link key={q.href} href={q.href} className={btnCls("neutral", "px-3.5")}>
              {q.icon} {q.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Matches that closed on the clock but still need a winner. */}
      {awaiting.length ? (
        <section className="card-shadow rounded-2xl border border-gold/35 bg-gold/5 p-4">
          <h3 className="font-display flex items-center gap-2 text-base font-bold text-gold">
            <IconTrophy className="h-4 w-4" />
            {awaiting.length} match{awaiting.length === 1 ? "" : "es"} waiting on a result
          </h3>
          <ul className="mt-2.5 space-y-1.5">
            {awaiting.slice(0, 4).map((o) => (
              <li key={o.match.id} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="truncate font-semibold text-ink">{o.match.title}</span>
                <span className="shrink-0 text-[11px] text-muted">{coins(o.totalStake)}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/matches" className={btnCls("gold", "mt-3 w-full py-2.5")}>
            Settle now
          </Link>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent matches. */}
        <section className="card-shadow rounded-2xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display flex items-center gap-2 text-base font-bold text-ink">
              <IconTrophy className="h-4 w-4 text-gold" /> Recent matches
            </h3>
            <Link href="/admin/matches" className="text-[12px] font-semibold text-brand hover:underline">
              View all →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No matches yet" hint="Create one from the Matches tab to open a toss market." />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recent.map((o) => (
                <li key={o.match.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-ink">{o.match.title}</div>
                    <div className="truncate text-[11px] text-muted">{fmtDateTime(o.match.start_time)}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted">{coins(o.totalStake)}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${PHASE_TONE[o.phase].chip}`}>
                      <IconDot className="h-1.5 w-1.5" />
                      {PHASE_TONE[o.phase].label}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Top balances. */}
        <section className="card-shadow rounded-2xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display flex items-center gap-2 text-base font-bold text-ink">
              <IconUsers className="h-4 w-4 text-brand" /> Top balances
            </h3>
            <Link href="/admin/users" className="text-[12px] font-semibold text-brand hover:underline">
              View all →
            </Link>
          </div>

          {topClients.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No users yet" hint="Add your first client from the User Mgmt tab." />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {topClients.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={c.username} className="h-8 w-8 text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-ink">{c.username}</div>
                    {c.exposure > 0 ? <div className="text-[11px] text-lay">Exp {coins(c.exposure)}</div> : null}
                  </div>
                  <span className="shrink-0 font-display text-[15px] font-extrabold tabular-nums text-gold">
                    {coins(c.balance)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
