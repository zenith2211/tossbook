import { getSessionUser, downlineIds } from "@/lib/auth";
import { db } from "@/lib/db";
import { coins, fmtDateTime, signed } from "@/lib/format";
import { EmptyState, StatTile } from "@/components/admin/kit";
import { IconBook } from "@/components/icons";

export const dynamic = "force-dynamic";

interface BookRow {
  id: number;
  username: string;
  type: string;
  amount: number;
  balance_after: number;
  remark: string;
  created_at: string;
}

const TITLE: Record<string, string> = {
  opening: "Opening balance",
  deposit: "Deposit",
  withdraw: "Withdraw",
  settle_win: "Bet won",
  settle_loss: "Bet lost",
  transfer_in: "Transfer in",
  transfer_out: "Transfer out",
};

/** Every wallet movement across the whole book, newest first. */
export default async function AdminPassbook() {
  const me = (await getSessionUser())!;
  const ids = downlineIds(me.id);

  const rows = ids.length
    ? (db
        .prepare(
          `SELECT l.id, u.username, l.type, l.amount, l.balance_after, l.remark, l.created_at
           FROM ledger l JOIN users u ON u.id = l.user_id
           WHERE l.user_id IN (${ids.map(() => "?").join(",")})
           ORDER BY l.id DESC LIMIT 300`,
        )
        .all(...ids) as BookRow[])
    : [];

  const inflow = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const outflow = rows.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);

  return (
    <div className="space-y-4">
      <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="text-brand">
            <IconBook className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl font-extrabold text-ink">Passbook</h2>
        </div>
        <p className="mt-1 text-[12px] text-muted">Every wallet movement across the book.</p>

        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          <StatTile label="Total in" value={coins(inflow)} tone="brand" />
          <StatTile label="Total out" value={coins(outflow)} tone="lay" />
          <StatTile label="Net" value={signed(inflow - outflow)} tone={inflow - outflow >= 0 ? "brand" : "lay"} />
        </div>
      </section>

      {rows.length === 0 ? (
        <EmptyState icon={<IconBook className="h-8 w-8" />} title="Nothing recorded yet" hint="Deposits, withdrawals and settled bets all land here." />
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <article key={r.id} className="card-shadow flex items-center gap-3 rounded-2xl border border-line bg-panel p-3.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-ink">
                  {TITLE[r.type] ?? r.type.replace(/_/g, " ")}
                  <span className="ml-1.5 font-normal text-muted">· {r.username}</span>
                </div>
                <div className="truncate text-[11px] text-muted">
                  {fmtDateTime(r.created_at)}
                  {r.remark ? ` · ${r.remark}` : ""}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className={`font-display text-[15px] font-extrabold tabular-nums ${r.amount >= 0 ? "text-emerald-600" : "text-lay"}`}>
                  {signed(r.amount)}
                </div>
                <div className="text-[11px] tabular-nums text-muted">{coins(r.balance_after)}</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
