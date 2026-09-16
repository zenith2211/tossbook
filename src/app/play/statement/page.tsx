import { getSessionUser } from "@/lib/auth";
import { available, listLedger } from "@/lib/domain";
import { Card, CardHead, Empty, Stat } from "@/components/ui";
import { coins, signed, pnlClass, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  opening: "Opening balance",
  deposit: "Deposit",
  withdraw: "Withdraw",
  settle_win: "Bet won",
  settle_loss: "Bet lost",
  transfer_in: "Transfer in",
  transfer_out: "Transfer out",
};

export default async function Statement() {
  const me = (await getSessionUser())!;
  const rows = listLedger(me.id, 300);

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold">Account Statement</h1>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Balance" value={coins(me.balance)} accent="text-gold" />
        <Stat label="Available" value={coins(available(me))} />
      </div>

      <Card>
        <CardHead title="Ledger" sub="Every transaction on your account" />
        {rows.length === 0 ? (
          <Empty>No transactions yet.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{LABEL[r.type] ?? r.type}</div>
                  <div className="truncate text-xs text-muted">{r.remark || fmtDateTime(r.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold tabular-nums ${pnlClass(r.amount)}`}>{signed(r.amount)}</div>
                  <div className="text-xs text-muted">Bal {coins(r.balance_after)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
