import { getSessionUser } from "@/lib/auth";
import { available, listMatches, listMarkets, listBetsForUser } from "@/lib/domain";
import { MatchCard, type MatchDTO } from "@/components/match-card";
import { FundRequest } from "@/components/fund-request";
import { Empty, Card, CardHead } from "@/components/ui";
import { coins } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlayHome() {
  const me = (await getSessionUser())!;
  const avail = available(me);

  // Which side (if any) the client has already backed per market — used to
  // lock the opposite team (one-sided betting) in the UI.
  const backed: Record<number, "A" | "B"> = {};
  for (const b of listBetsForUser(me.id)) {
    if (b.status === "open") backed[b.market_id] = b.selection;
  }

  // Once a match's betting-close time passes it leaves the arena (bets remain
  // visible in My Bets, and results show up in the Passbook after settlement).
  const now = Date.now();
  const matches = listMatches(["live", "upcoming"]).filter(
    (m) => !m.end_time || new Date(m.end_time).getTime() > now,
  );
  const dtos: MatchDTO[] = matches.map((m) => ({
    id: m.id,
    title: m.title,
    team_a: m.team_a,
    team_b: m.team_b,
    league: m.league,
    status: m.status,
    start_time: m.start_time,
    end_time: m.end_time,
    image_url: m.image_url,
    markets: listMarkets(m.id)
      .filter((mk) => mk.type === "toss")
      .map((mk) => ({
      id: mk.id,
      type: mk.type,
      name: mk.name,
      status: mk.status,
      rate_a: mk.rate_a,
      rate_b: mk.rate_b,
      min_stake: mk.min_stake,
      max_stake: mk.max_stake,
      result: mk.result,
    })),
  }));

  const live = dtos.filter((d) => d.status === "live");
  const upcoming = dtos.filter((d) => d.status === "upcoming");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold">Hi, {me.name} 👋</h1>
        <p className="text-sm text-muted">Pick a match and back the toss.</p>
      </div>

      <div className="card-shadow rounded-2xl border border-line bg-panel p-4">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Available balance</div>
            <div className="text-2xl font-extrabold tabular-nums text-gold">{coins(avail)}</div>
          </div>
          {me.exposure > 0 ? (
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Exposure</div>
              <div className="text-sm font-bold tabular-nums text-lay">{coins(me.exposure)}</div>
            </div>
          ) : null}
        </div>
        <FundRequest username={me.username} available={avail} />
      </div>

      {live.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink/80">
            <span className="h-2 w-2 animate-pulse rounded-full bg-lay" /> Live Now
          </h2>
          {live.map((m) => (
            <MatchCard key={m.id} match={m} available={avail} backed={backed} />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink/80">Upcoming</h2>
        {upcoming.length > 0 ? (
          upcoming.map((m) => <MatchCard key={m.id} match={m} available={avail} backed={backed} />)
        ) : (
          <Card>
            <CardHead title="No upcoming matches" />
            <Empty>New matches will appear here as soon as the admin opens them.</Empty>
          </Card>
        )}
      </section>
    </div>
  );
}
