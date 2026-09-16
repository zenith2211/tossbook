import { getSessionUser } from "@/lib/auth";
import { available, listLedger } from "@/lib/domain";
import { Card, CardHead, Empty, Stat } from "@/components/ui";
import { coins, signed, pnlClass, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyLedger() {
  const me = (await getSessionUser())!;
  const rows = listLedger(me.id, 300);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">My Ledger</h1>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Balance" value={coins(me.balance)} accent="text-gold" />
        <Stat label="Available" value={coins(available(me))} />
        <Stat label="Exposure" value={coins(me.exposure)} accent={me.exposure > 0 ? "text-lay" : ""} />
      </div>

      <Card>
        <CardHead title="Cash Statement" sub="Deposits to and withdrawals from your downline" />
        {rows.length === 0 ? (
          <Empty>No transactions yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Remark</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line/60">
                    <td className="px-4 py-2 capitalize">{r.type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-2 text-muted">{r.remark}</td>
                    <td className="px-4 py-2 text-xs text-muted">{fmtDateTime(r.created_at)}</td>
                    <td className={`px-4 py-2 text-right font-semibold tabular-nums ${pnlClass(r.amount)}`}>{signed(r.amount)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{coins(r.balance_after)}</td>
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
