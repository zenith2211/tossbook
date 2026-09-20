"use client";

import { useMemo, useState } from "react";
import type { Activity, ActivityKind } from "@/lib/domain";
import { coins, parseStamp } from "@/lib/format";
import { EmptyState } from "@/components/admin/kit";
import {
  IconBook,
  IconCash,
  IconCheckCircle,
  IconClock,
  IconDownload,
  IconSearch,
  IconSheet,
  IconSliders,
  IconTrendUp,
  IconXCircle,
} from "@/components/icons";

const KIND_STYLE: Record<ActivityKind, { chip: string; row: string; icon: React.ReactNode }> = {
  deposit: {
    chip: "bg-emerald-500/12 text-emerald-600",
    row: "border-emerald-500/25 bg-emerald-500/6",
    icon: <IconTrendUp className="h-4 w-4" />,
  },
  withdraw: {
    chip: "bg-lay/12 text-lay",
    row: "border-lay/25 bg-lay/6",
    icon: <IconCash className="h-4 w-4" />,
  },
  bet_placed: {
    chip: "bg-gold/15 text-gold",
    row: "border-gold/25 bg-gold/6",
    icon: <IconClock className="h-4 w-4" />,
  },
  bet_won: {
    chip: "bg-emerald-500/12 text-emerald-600",
    row: "border-emerald-500/25 bg-emerald-500/6",
    icon: <IconCheckCircle className="h-4 w-4" />,
  },
  bet_lost: {
    chip: "bg-lay/12 text-lay",
    row: "border-lay/25 bg-lay/6",
    icon: <IconXCircle className="h-4 w-4" />,
  },
  refund: {
    chip: "bg-purple/12 text-purple",
    row: "border-purple/25 bg-purple/6",
    icon: <IconCash className="h-4 w-4" />,
  },
  adjust: {
    chip: "bg-panel-2 text-muted",
    row: "border-line bg-panel-2/60",
    icon: <IconSliders className="h-4 w-4" />,
  },
};

const FILTERS: { key: "all" | ActivityKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "bet_placed", label: "Bets" },
  { key: "bet_won", label: "Won" },
  { key: "bet_lost", label: "Lost" },
  { key: "refund", label: "Refunds" },
  { key: "deposit", label: "Deposits" },
  { key: "withdraw", label: "Withdrawals" },
];

function fullStamp(iso: string): string {
  const d = parseStamp(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function money2(n: number): string {
  return `₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Passbook({ rows }: { rows: Activity[] }) {
  const [filter, setFilter] = useState<"all" | ActivityKind>("all");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.kind !== filter) return false;
      if (q && ![r.title, r.detail].some((s) => s.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, filter, query]);

  const totals = useMemo(() => {
    const inflow = visible.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
    const outflow = visible.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [visible]);

  function download(kind: "csv" | "xls") {
    const head = ["Date", "Type", "Detail", "Amount", "Balance after"];
    const body = visible.map((r) => [fullStamp(r.at), r.title, r.detail, r.amount.toFixed(2), (r.balanceAfter ?? 0).toFixed(2)]);

    let blob: Blob;
    if (kind === "csv") {
      const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const csv = [head, ...body].map((row) => row.map(esc).join(",")).join("\r\n");
      blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    } else {
      // Excel opens an HTML table saved as .xls without needing a library.
      const cell = (v: string) => `<td>${v.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</td>`;
      const html =
        `<html><head><meta charset="utf-8"></head><body><table border="1">` +
        `<tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>` +
        body.map((row) => `<tr>${row.map(cell).join("")}</tr>`).join("") +
        `</table></body></html>`;
      blob = new Blob([html], { type: "application/vnd.ms-excel" });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `passbook-${new Date().toISOString().slice(0, 10)}.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <section className="card-shadow rounded-2xl border border-line bg-panel p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-back/12 text-back">
              <IconTrendUp className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-lg font-extrabold leading-tight text-ink">Transaction History</h1>
              <p className="text-[12px] text-muted">{visible.length} records</p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-panel-2 py-2.5 text-[13px] font-bold text-ink/75 transition hover:text-ink"
          >
            <IconSliders className="h-4 w-4" /> Filters
          </button>
          <button
            type="button"
            onClick={() => download("csv")}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-panel-2 py-2.5 text-[13px] font-bold text-ink/75 transition hover:text-ink"
          >
            <IconDownload className="h-4 w-4" /> CSV
          </button>
          <button
            type="button"
            onClick={() => download("xls")}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-panel-2 py-2.5 text-[13px] font-bold text-ink/75 transition hover:text-ink"
          >
            <IconSheet className="h-4 w-4" /> Excel
          </button>
        </div>

        {showFilters ? (
          <div className="animate-slide-down mt-3 space-y-2.5">
            <label className="relative block">
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search entries…"
                aria-label="Search passbook"
                className="w-full rounded-xl border border-line bg-panel-2 py-2.5 pl-11 pr-4 text-sm text-ink outline-none focus:border-brand/40 focus:bg-panel focus:ring-4 focus:ring-brand/10"
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => {
                const on = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    aria-pressed={on}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
                      on ? "bg-back text-white" : "border border-line bg-panel-2 text-muted hover:text-ink"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Total label="Total in" value={money2(totals.inflow)} tone="text-emerald-600" />
          <Total label="Total out" value={money2(totals.outflow)} tone="text-lay" />
          <Total
            label="Net"
            value={`${totals.net >= 0 ? "+" : "−"}${money2(totals.net)}`}
            tone={totals.net >= 0 ? "text-emerald-600" : "text-lay"}
          />
        </div>
      </section>

      {visible.length === 0 ? (
        <EmptyState
          icon={<IconBook className="h-8 w-8" />}
          title={rows.length === 0 ? "Nothing here yet" : "No entries match those filters"}
          hint={
            rows.length === 0
              ? "Deposits, picks, refunds and settlements all show up here with your running balance."
              : "Try a different category or clear the search."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {visible.map((r) => {
            const style = KIND_STYLE[r.kind];
            return (
              <article key={r.key} className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 ${style.row}`}>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${style.chip}`}>{style.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold text-ink">{r.title}</div>
                  {r.detail ? <div className="truncate text-[12px] text-muted">{r.detail}</div> : null}
                  <div className="text-[11px] text-muted">{fullStamp(r.at)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className={`font-display text-[15px] font-extrabold tabular-nums ${
                      r.amount >= 0 ? "text-emerald-600" : "text-lay"
                    }`}
                  >
                    {r.amount >= 0 ? "+" : "−"}
                    {money2(r.amount)}
                  </div>
                  {r.balanceAfter != null ? (
                    <div className="text-[11px] tabular-nums text-muted">
                      {coins(r.balanceAfter - r.amount)} → {coins(r.balanceAfter)}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Total({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel-2 px-2 py-2.5 text-center">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className={`font-display truncate text-[12px] font-extrabold tabular-nums sm:text-[15px] ${tone}`}>{value}</div>
    </div>
  );
}
