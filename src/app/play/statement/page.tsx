import { getSessionUser } from "@/lib/auth";
import { available, listLedger } from "@/lib/domain";
import { Stat } from "@/components/ui";
import { LedgerTable } from "@/components/ledger-table";
import { coins } from "@/lib/format";

export const dynamic = "force-dynamic";

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

      <LedgerTable
        rows={rows.map((r) => ({
          id: r.id,
          type: r.type,
          amount: r.amount,
          balance_after: r.balance_after,
          remark: r.remark,
          created_at: r.created_at,
        }))}
      />
    </div>
  );
}
