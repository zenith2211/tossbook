import { getSessionUser, downlineIds } from "@/lib/auth";
import { listBetEvents } from "@/lib/domain";
import { ActivityBoard, type ActivityEvent } from "@/components/admin/activity-board";

export const dynamic = "force-dynamic";

export default async function AdminActivity() {
  const me = (await getSessionUser())!;
  const ids = downlineIds(me.id).filter((id) => id !== me.id);

  const events: ActivityEvent[] = listBetEvents(ids).map((e) => ({
    key: e.key,
    kind: e.kind,
    username: e.username,
    matchTitle: e.matchTitle,
    selectionName: e.selectionName,
    stake: e.stake,
    rate: e.rate,
    resultPl: e.resultPl,
    at: e.at,
  }));

  return <ActivityBoard events={events} />;
}
