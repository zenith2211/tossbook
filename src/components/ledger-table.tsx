"use client";

import { useMemo, useState } from "react";
import { Card, CardHead, Empty } from "./ui";
import { coins, signed, pnlClass, fmtDateTime, round2 } from "@/lib/format";

export type LedgerRow = {
  id: number;
  type: string;
  amount: number;
  balance_after: number;
  remark: string;
  created_at: string;
};

const LABEL: Record<string, string> = {
  opening: "Opening balance",
  deposit: "Deposit",
  withdraw: "Withdraw",
  settle_win: "Bet won",
  settle_loss: "Bet lost",
  transfer_in: "Transfer in",
  transfer_out: "Transfer out",
};

function label(t: string): string {
  return LABEL[t] ?? t;
}

export function LedgerTable({ rows }: { rows: LedgerRow[] }) {
  const [q, setQ] = useState("");

  const totals = useMemo(() => {
    let inSum = 0;
    let outSum = 0;
    for (const r of rows) {
      if (r.amount > 0) inSum += r.amount;
      else if (r.amount < 0) outSum += -r.amount;
    }
    return { in: inSum, out: outSum, net: inSum - outSum };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) => label(r.type).toLowerCase().includes(needle) || (r.remark ?? "").toLowerCase().includes(needle),
    );
  }, [rows, q]);

  function exportCsv() {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [["Date", "Type", "Description", "Amount", "Balance Before", "Balance After"].map(esc).join(",")];
    for (const r of rows) {
      lines.push(
        [
          esc(fmtDateTime(r.created_at)),
          esc(label(r.type)),
          esc(r.remark || ""),
          esc(String(r.amount)),
          esc(String(round2(r.balance_after - r.amount))),
          esc(String(r.balance_after)),
        ].join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tossbook-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="card-shadow rounded-xl border border-line bg-panel px-3 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Total In</div>
          <div className="mt-1 text-base font-extrabold tabular-nums text-brand">{coins(totals.in)}</div>
        </div>
        <div className="card-shadow rounded-xl border border-line bg-panel px-3 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Total Out</div>
          <div className="mt-1 text-base font-extrabold tabular-nums text-lay">{coins(totals.out)}</div>
        </div>
        <div className="card-shadow rounded-xl border border-line bg-panel px-3 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Net</div>
          <div className={`mt-1 text-base font-extrabold tabular-nums ${pnlClass(totals.net)}`}>{signed(totals.net)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search transactions…"
          className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="shrink-0 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-semibold text-ink/80 transition hover:border-brand/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          CSV
        </button>
      </div>

      <Card>
        <CardHead title="Transactions" sub={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
        {filtered.length === 0 ? (
          <Empty>No transactions match this view.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{label(r.type)}</div>
                  <div className="truncate text-xs text-muted">{r.remark || fmtDateTime(r.created_at)}</div>
                </div>
                <div className="ml-3 text-right">
                  <div className={`text-sm font-bold tabular-nums ${pnlClass(r.amount)}`}>{signed(r.amount)}</div>
                  <div className="text-xs text-muted tabular-nums">
                    {coins(round2(r.balance_after - r.amount))} → {coins(r.balance_after)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
