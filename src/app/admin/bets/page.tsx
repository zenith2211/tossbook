import { getSessionUser, downlineIds } from "@/lib/auth";
import { listBets } from "@/lib/domain";
import { BetsBoard, type AdminBetView } from "@/components/admin/bets-board";

export const dynamic = "force-dynamic";

export default async function AdminBetsPage() {
  const me = (await getSessionUser())!;
  const ids = downlineIds(me.id).filter((id) => id !== me.id);

  const bets: AdminBetView[] = (ids.length ? listBets({ userIds: ids }) : []).map((b) => ({
    id: b.id,
    username: b.username,
    matchTitle: b.match_title,
    selectionName: b.selection_name,
    stake: b.stake,
    rate: b.rate,
    status: b.status,
    resultPl: b.result_pl,
    voidReason: b.void_reason,
    placedAt: b.placed_at,
  }));

  return <BetsBoard bets={bets} />;
}
