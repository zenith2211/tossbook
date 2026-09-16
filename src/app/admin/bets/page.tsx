import { getSessionUser, downlineIds } from "@/lib/auth";
import { db } from "@/lib/db";
import { listBets } from "@/lib/domain";
import { Card, CardHead, Badge, Empty, PnL, Stat } from "@/components/ui";
import { coins, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminBets() {
  const me = (await getSessionUser())!;
  const ids = downlineIds(me.id);
  const clientIds =
    ids.length > 0
      ? (db
          .prepare(`SELECT id FROM users WHERE role='client' AND id IN (${ids.map(() => "?").join(",")})`)
          .all(...ids) as { id: number }[]).map((r) => r.id)
      : [];

  const bets = clientIds.length ? listBets({ userIds: clientIds }) : [];
  const open = bets.filter((b) => b.status === "open");
  const staked = bets.reduce((s, b) => s + b.stake, 0);
  const bookPL = -bets.filter((b) => b.status !== "open").reduce((s, b) => s + b.result_pl, 0);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Bets</h1>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total Bets" value={bets.length} sub={`${open.length} open`} />
        <Stat label="Total Staked" value={coins(staked)} />
        <Stat label="Book P&L" value={<PnL value={bookPL} />} />
      </div>

      <Card>
        <CardHead title="All Downline Bets" right={<Badge tone="muted">{bets.length}</Badge>} />
        {bets.length === 0 ? (
          <Empty>No bets from your downline yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Match</th>
                  <th className="px-4 py-2">Selection</th>
                  <th className="px-4 py-2 text-right">Stake</th>
                  <th className="px-4 py-2 text-right">Rate</th>
                  <th className="px-4 py-2">Placed</th>
                  <th className="px-4 py-2 text-right">Status / P&L</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((b) => (
                  <tr key={b.id} className="border-b border-line/60">
                    <td className="px-4 py-2 font-medium">@{b.username}</td>
                    <td className="px-4 py-2 text-muted">{b.match_title}</td>
                    <td className="px-4 py-2">
                      {b.selection_name}
                      <span className="ml-1 text-xs text-muted">({b.market_type === "toss" ? "Toss" : "Match"})</span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{coins(b.stake)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{b.rate.toFixed(2)}</td>
                    <td className="px-4 py-2 text-xs text-muted">{fmtDateTime(b.placed_at)}</td>
                    <td className="px-4 py-2 text-right">
                      {b.status === "open" ? <Badge tone="gold">Open</Badge> : <PnL value={b.result_pl} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
