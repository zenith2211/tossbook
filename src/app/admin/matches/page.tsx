import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { dbOverview, listBets, listMatchOverviews } from "@/lib/domain";
import { MatchesBoard } from "@/components/admin/matches-board";
import type { MatchBetView, MatchCardView } from "@/components/admin/match-view";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const me = (await getSessionUser())!;
  if (me.role !== "admin") redirect("/admin");

  const overviews = listMatchOverviews();

  // One query for every bet on the board, then bucketed per match — cheaper
  // than a round trip for each card.
  const betsByMatch = new Map<number, MatchBetView[]>();
  for (const b of listBets({})) {
    const list = betsByMatch.get(b.match_id) ?? [];
    list.push({
      id: b.id,
      username: b.username,
      side: b.selection,
      selectionName: b.selection_name,
      stake: b.stake,
      rate: b.rate,
      status: b.status,
      resultPl: b.result_pl,
      placedAt: b.placed_at,
    });
    betsByMatch.set(b.match_id, list);
  }

  const matches: MatchCardView[] = overviews.map((o) => ({
    id: o.match.id,
    title: o.match.title,
    league: o.match.league,
    teamA: o.match.team_a,
    teamB: o.match.team_b,
    startTime: o.match.start_time,
    liveTime: o.match.live_time,
    endTime: o.match.end_time,
    // Cached image endpoint, not inline base64 — keeps the page payload small.
    imageUrl: o.match.image_url ? `/api/poster/${o.match.id}` : null,
    phase: o.phase,
    winner: o.winner,
    settled: o.market?.status === "settled",
    rateA: o.market?.rate_a ?? 1.95,
    rateB: o.market?.rate_b ?? 1.95,
    maxStake: o.market?.max_stake ?? 50000,
    minStake: o.market?.min_stake ?? 100,
    betsA: o.betsA,
    betsB: o.betsB,
    stakeA: o.stakeA,
    stakeB: o.stakeB,
    payoutA: o.payoutA,
    payoutB: o.payoutB,
    houseIfA: o.houseIfA,
    houseIfB: o.houseIfB,
    totalBets: o.totalBets,
    totalStake: o.totalStake,
    bets: betsByMatch.get(o.match.id) ?? [],
  }));

  return <MatchesBoard matches={matches} db={dbOverview()} />;
}
