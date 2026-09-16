import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listChildren, bookPnL, totalExposure } from "@/lib/domain";
import { Card, CardHead, Stat, Empty, PnL } from "@/components/ui";
import { coins } from "@/lib/format";

export const dynamic = "force-dynamic";

function stakedFor(clientIds: number[]): number {
  if (!clientIds.length) return 0;
  return (
    db
      .prepare(
        `SELECT COALESCE(SUM(stake),0) AS s FROM bets WHERE status IN ('won','lost') AND user_id IN (${clientIds
          .map(() => "?")
          .join(",")})`,
      )
      .get(...clientIds) as { s: number }
  ).s;
}

export default async function Reports() {
  const me = (await getSessionUser())!;
  const clients = listChildren(me.id);
  const clientIds = clients.map((c) => c.id);

  const rows = clients.map((c) => ({
    user: c,
    pl: bookPnL([c.id]),
    exposure: c.exposure,
    staked: stakedFor([c.id]),
  }));

  const totalPL = bookPnL(clientIds);
  const totalExp = totalExposure(clientIds);
  const totalStaked = stakedFor(clientIds);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Reports</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Book P&L" value={<PnL value={totalPL} />} sub="Net from all clients" />
        <Stat label="Total Staked" value={coins(totalStaked)} />
        <Stat label="Live Exposure" value={coins(totalExp)} accent={totalExp > 0 ? "text-lay" : ""} />
        <Stat label="Clients" value={clients.length} />
      </div>

      <Card>
        <CardHead title="Profit / Loss by Client" />
        {rows.length === 0 ? (
          <Empty>No clients to report on yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2 text-right">Staked</th>
                  <th className="px-4 py-2 text-right">Balance</th>
                  <th className="px-4 py-2 text-right">Exposure</th>
                  <th className="px-4 py-2 text-right">Book P&L</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user.id} className="border-b border-line/60 hover:bg-ink/5">
                    <td className="px-4 py-2">
                      <Link href={`/admin/users/${r.user.id}`} className="font-medium hover:text-brand">
                        {r.user.name} <span className="text-xs text-muted">@{r.user.username}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{coins(r.staked)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{coins(r.user.balance)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{coins(r.exposure)}</td>
                    <td className="px-4 py-2 text-right"><PnL value={r.pl} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line font-semibold">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right tabular-nums">{coins(totalStaked)}</td>
                  <td className="px-4 py-2 text-right"></td>
                  <td className="px-4 py-2 text-right tabular-nums">{coins(totalExp)}</td>
                  <td className="px-4 py-2 text-right"><PnL value={totalPL} /></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
