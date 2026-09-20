"use client";

import { useMemo, useState } from "react";
import { Card, CardHead, Empty } from "./ui";
import { coins, signed, fmtDateTime, round2 } from "@/lib/format";
import { IconCash, IconTicket, IconTrophy, IconBack } from "./icons";

export type ActivityRow = {
  key: string;
  kind: string;
  title: string;
  detail: string;
  amount: number;
  balanceAfter: number | null;
  cash: boolean;
  at: string;
};

type Filter = "All" | "Bets" | "Won" | "Lost" | "Refunds" | "Deposits" | "Withdrawals";
const FILTERS: Filter[] = ["All", "Bets", "Won", "Lost", "Refunds", "Deposits", "Withdrawals"];

function matches(a: ActivityRow, f: Filter): boolean {
  switch (f) {
    case "All": return true;
    case "Bets": return a.kind === "bet_placed";
    case "Won": return a.kind === "bet_won";
    case "Lost": return a.kind === "bet_lost";
    case "Refunds": return a.kind === "refund";
    case "Deposits": return a.kind === "deposit";
    case "Withdrawals": return a.kind === "withdraw";
  }
}

function Icon({ kind }: { kind: string }) {
  const cls = "h-4 w-4";
  if (kind === "bet_won") return <IconTrophy className={cls} />;
  if (kind === "bet_placed") return <IconTicket className={cls} />;
  if (kind === "refund") return <span className="inline-block rotate-180"><IconBack className={cls} /></span>;
  if (kind === "bet_lost")
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    );
  return <IconCash className={cls} />;
}

const TONE: Record<string, { text: string; badge: string }> = {
  deposit: { text: "text-brand", badge: "bg-brand/10 text-brand" },
  withdraw: { text: "text-lay", badge: "bg-lay/10 text-lay" },
  bet_placed: { text: "text-gold", badge: "bg-gold/10 text-gold" },
  bet_won: { text: "text-brand", badge: "bg-brand/10 text-brand" },
  bet_lost: { text: "text-danger", badge: "bg-danger/10 text-danger" },
  refund: { text: "text-back", badge: "bg-back/10 text-back" },
  adjust: { text: "text-muted", badge: "bg-panel-2 text-muted" },
};

export function ActivityFeed({ rows }: { rows: ActivityRow[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const totals = useMemo(() => {
    let inSum = 0, outSum = 0;
    for (const r of rows) {
      if (!r.cash) continue;
      if (r.amount > 0) inSum += r.amount;
      else if (r.amount < 0) outSum += -r.amount;
    }
    return { in: inSum, out: outSum, net: inSum - outSum };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        matches(r, filter) &&
        (needle === "" || r.title.toLowerCase().includes(needle) || r.detail.toLowerCase().includes(needle)),
    );
  }, [rows, filter, q]);

  function download(name: string, mime: string, content: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const stamp = new Date().toISOString().slice(0, 10);

  function exportCsv() {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [["Date", "Type", "Details", "Amount", "Balance"].map(esc).join(",")];
    for (const r of rows) {
      lines.push(
        [
          esc(fmtDateTime(r.at)),
          esc(r.title),
          esc(r.detail),
          esc(String(r.amount)),
          esc(r.balanceAfter != null ? String(r.balanceAfter) : ""),
        ].join(","),
      );
    }
    download(`tossbook-passbook-${stamp}.csv`, "text/csv;charset=utf-8;", lines.join("\n"));
  }

  function exportExcel() {
    const esc = (v: string) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const body = rows
      .map(
        (r) =>
          `<tr><td>${esc(fmtDateTime(r.at))}</td><td>${esc(r.title)}</td><td>${esc(r.detail)}</td>` +
          `<td>${r.amount}</td><td>${r.balanceAfter ?? ""}</td></tr>`,
      )
      .join("");
    const html =
      `<table border="1"><tr><th>Date</th><th>Type</th><th>Details</th><th>Amount</th><th>Balance</th></tr>${body}</table>`;
    download(`tossbook-passbook-${stamp}.xls`, "application/vnd.ms-excel", html);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-ink/80 transition hover:border-brand/40 hover:text-ink disabled:opacity-50"
        >
          ⬇ CSV
        </button>
        <button
          type="button"
          onClick={exportExcel}
          disabled={rows.length === 0}
          className="rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-ink/80 transition hover:border-brand/40 hover:text-ink disabled:opacity-50"
        >
          ⬇ Excel
        </button>
      </div>

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
          <div className={`mt-1 text-base font-extrabold tabular-nums ${totals.net >= 0 ? "text-brand" : "text-lay"}`}>
            {signed(totals.net)}
          </div>
        </div>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search team, tournament or type…"
        className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
      />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === f ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        <CardHead title="Transaction history" sub={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
        {filtered.length === 0 ? (
          <Empty>Nothing matches this view yet.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((r) => {
              const tone = TONE[r.kind] ?? TONE.adjust;
              return (
                <li key={r.key} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone.badge}`}>
                      <Icon kind={r.kind} />
                    </span>
                    <div className="min-w-0">
                      <div className={`text-sm font-bold ${tone.text}`}>{r.title}</div>
                      {r.detail ? <div className="truncate text-xs text-muted">{r.detail}</div> : null}
                      <div className="text-[11px] text-muted">{fmtDateTime(r.at)}</div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-sm font-bold tabular-nums ${r.amount >= 0 ? "text-brand" : tone.text}`}>
                      {signed(r.amount)}
                    </div>
                    {r.cash && r.balanceAfter != null ? (
                      <div className="text-[11px] text-muted tabular-nums">
                        {coins(round2(r.balanceAfter - r.amount))} → {coins(r.balanceAfter)}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
