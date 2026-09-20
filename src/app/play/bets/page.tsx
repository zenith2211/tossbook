import { getSessionUser } from "@/lib/auth";
import { listBets, getMatch } from "@/lib/domain";
import { PicksList, type PickRow } from "@/components/play/picks-list";

export const dynamic = "force-dynamic";

export default async function MyBets() {
  const me = (await getSessionUser())!;

  const picks: PickRow[] = listBets({ userIds: [me.id] }).map((b) => ({
    id: b.id,
    matchTitle: b.match_title,
    league: getMatch(b.match_id)?.league ?? "",
    selectionName: b.selection_name,
    stake: b.stake,
    rate: b.rate,
    status: b.status,
    voidReason: b.void_reason,
    resultPl: b.result_pl,
    placedAt: b.placed_at,
    matchEndTime: b.match_end_time,
  }));

  return <PicksList picks={picks} />;
}
