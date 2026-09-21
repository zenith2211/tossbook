import { getSessionUser } from "@/lib/auth";
import { available, listMatches, listBetsForUser, tossMarket } from "@/lib/domain";
import { PlayMatchCard, type PlayMatchDTO, type MyPickDTO } from "@/components/play/match-card";
import { WalletCard, RefreshButton } from "@/components/play/wallet-card";
import { EmptyState } from "@/components/admin/kit";
import { IconCricket } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function PlayHome() {
  const me = (await getSessionUser())!;
  const avail = available(me);

  // Open picks per match, so a card can show "YOUR PICK" and the locked stake.
  const picksByMatch = new Map<number, MyPickDTO[]>();
  for (const b of listBetsForUser(me.id)) {
    if (b.status !== "open") continue;
    const list = picksByMatch.get(b.match_id) ?? [];
    list.push({ betId: b.id, side: b.selection, stake: b.stake, rate: b.rate });
    picksByMatch.set(b.match_id, list);
  }

  // A match leaves the arena once its close time passes — the picks stay
  // visible under My Bets, and results land in the Passbook after settlement.
  const now = Date.now();
  const matches = listMatches(["live", "upcoming"]).filter(
    (m) => !m.end_time || new Date(m.end_time).getTime() > now,
  );

  const dtos: PlayMatchDTO[] = matches.map((m) => {
    const mk = tossMarket(m.id);
    return {
      id: m.id,
      title: m.title,
      league: m.league,
      teamA: m.team_a,
      teamB: m.team_b,
      status: m.status,
      startTime: m.start_time,
      endTime: m.end_time,
      // Served from a cached endpoint instead of inlining base64 in the page.
      imageUrl: m.image_url ? `/api/poster/${m.id}` : null,
      market: mk
        ? {
            id: mk.id,
            rateA: mk.rate_a,
            rateB: mk.rate_b,
            minStake: mk.min_stake,
            maxStake: mk.max_stake,
            open: mk.status === "open",
          }
        : null,
      picks: picksByMatch.get(m.id) ?? [],
    };
  });

  const liveCount = dtos.filter((d) => d.status === "live").length;

  return (
    <div className="space-y-4">
      <WalletCard username={me.username} balance={avail} exposure={me.exposure} live={liveCount > 0} />

      <div className="flex items-center justify-center gap-2.5">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-2.5 text-[13px] font-bold text-ink">
          <IconCricket className="h-4 w-4 text-brand" />
          Active Matches
          <span className="grid h-6 min-w-[1.5rem] place-items-center rounded-full bg-panel-2 px-1.5 text-[12px] text-muted">
            {dtos.length}
          </span>
        </span>
        <RefreshButton />
      </div>

      {dtos.length === 0 ? (
        <EmptyState
          icon={<IconCricket className="h-8 w-8" />}
          title="No matches open right now"
          hint="New matches appear here the moment the admin opens them. Pull down or tap refresh to check again."
        />
      ) : (
        <div className="space-y-4">
          {dtos.map((m) => (
            <PlayMatchCard key={m.id} match={m} available={avail} />
          ))}
        </div>
      )}
    </div>
  );
}
