import { getSessionUser } from "@/lib/auth";
import { available, listActivity } from "@/lib/domain";
import { Stat } from "@/components/ui";
import { ActivityFeed } from "@/components/activity-feed";
import { coins } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Statement() {
  const me = (await getSessionUser())!;
  const activity = listActivity(me.id, 500);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold">Passbook</h1>
        <p className="text-sm text-muted">Every activity — bets, refunds, wins, losses, deposits &amp; withdrawals.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Balance" value={coins(me.balance)} accent="text-gold" />
        <Stat label="Available" value={coins(available(me))} />
      </div>

      <ActivityFeed rows={activity} />
    </div>
  );
}
