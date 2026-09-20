"use client";

import { useMemo, useState } from "react";
import { EmptyState, StatTile } from "./kit";
import { coins, fmtDateTime, signed } from "@/lib/format";
import { IconLedger, IconSearch, IconX } from "@/components/icons";

export interface AdminBetView {
  id: number;
  username: string;
  matchTitle: string;
  selectionName: string;
  stake: number;
  rate: number;
  status: "open" | "won" | "lost" | "void";
  resultPl: number;
  voidReason: string | null;
  placedAt: string;
}

type Filter = "all" | "open" | "won" | "lost" | "void";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
  { key: "void", label: "Refunded" },
];

const TONE: Record<AdminBetView["status"], string> = {
  open: "border-gold/35 bg-gold/10 text-gold",
  won: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  lost: "border-lay/30 bg-lay/10 text-lay",
  void: "border-purple/30 bg-purple/10 text-purple",
};

export function BetsBoard({ bets }: { bets: AdminBetView[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: bets.length, open: 0, won: 0, lost: 0, void: 0 };
    for (const b of bets) c[b.status] += 1;
    return c;
  }, [bets]);

  const totals = useMemo(() => {
    const staked = bets.reduce((s, b) => s + (b.status === "void" ? 0 : b.stake), 0);
    // The book wins what the clients lose, so the house P&L is the inverse.
    const bookPl = -bets.filter((b) => b.status === "won" || b.status === "lost").reduce((s, b) => s + b.resultPl, 0);
    const exposure = bets.filter((b) => b.status === "open").reduce((s, b) => s + b.stake, 0);
    return { staked, bookPl, exposure };
  }, [bets]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bets.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (q && ![b.username, b.matchTitle, b.selectionName].some((s) => s.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [bets, filter, query]);

  return (
    <div className="space-y-4">
      <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="text-brand">
            <IconLedger className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl font-extrabold text-ink">Bets</h2>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          <StatTile label="Total staked" value={coins(totals.staked)} />
          <StatTile label="Book P&L" value={signed(totals.bookPl)} tone={totals.bookPl >= 0 ? "brand" : "lay"} />
          <StatTile label="Live exposure" value={coins(totals.exposure)} tone="lay" />
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={on}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
                  on ? "bg-[#1e2b3d] text-white shadow-sm" : "border border-line bg-panel text-muted hover:text-ink"
                }`}
              >
                {f.label} ({counts[f.key]})
              </button>
            );
          })}
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
          <label className="relative min-w-[210px] flex-1">
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search user, match or pick…"
              aria-label="Search bets"
              className="w-full rounded-xl border border-transparent bg-panel-2 py-2.5 pl-10 pr-3 text-sm font-medium text-ink outline-none inset-soft placeholder:font-normal placeholder:text-muted/80 focus:border-brand/40 focus:bg-panel focus:ring-4 focus:ring-brand/10"
            />
          </label>
          {filter !== "all" || query ? (
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[13px] font-semibold text-muted hover:text-ink"
            >
              <IconX className="h-3.5 w-3.5" /> Clear
            </button>
          ) : null}
        </div>
      </section>

      {visible.length === 0 ? (
        <EmptyState
          icon={<IconLedger className="h-8 w-8" />}
          title={bets.length === 0 ? "No bets yet" : "No bets match those filters"}
          hint={
            bets.length === 0
              ? "Once your clients start picking toss winners, every bet shows up here."
              : "Try another status or clear the search."
          }
        />
      ) : (
        <>
          {/* Cards on phones. */}
          <div className="space-y-2.5 md:hidden">
            {visible.map((b) => (
              <article key={b.id} className="card-shadow rounded-2xl border border-line bg-panel p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display truncate text-[15px] font-bold text-ink">{b.username}</div>
                    <div className="truncate text-[12px] text-muted">{b.matchTitle}</div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${TONE[b.status]}`}>
                    {b.status === "void" ? b.voidReason ?? "refund" : b.status}
                  </span>
                </div>
                <div className="mt-2.5 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Pick</div>
                    <div className="text-[13px] font-semibold text-ink">
                      {b.selectionName} <span className="text-muted">{b.rate.toFixed(2)}x</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Stake</div>
                    <div className="font-display text-base font-extrabold tabular-nums text-ink">{coins(b.stake)}</div>
                  </div>
                  {b.status === "won" || b.status === "lost" ? (
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted">P&amp;L</div>
                      <div className={`font-display text-base font-extrabold tabular-nums ${b.resultPl >= 0 ? "text-emerald-600" : "text-lay"}`}>
                        {signed(b.resultPl)}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="mt-2 text-[11px] text-muted">{fmtDateTime(b.placedAt)}</div>
              </article>
            ))}
          </div>

          {/* Table from md up. */}
          <div className="card-shadow hidden overflow-x-auto rounded-2xl border border-line bg-panel md:block">
            <table className="w-full text-[13px]">
              <thead className="bg-panel-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-2.5">User</th>
                  <th className="px-4 py-2.5">Match</th>
                  <th className="px-4 py-2.5">Pick</th>
                  <th className="px-4 py-2.5 text-right">Stake</th>
                  <th className="px-4 py-2.5 text-right">Rate</th>
                  <th className="px-4 py-2.5">Placed</th>
                  <th className="px-4 py-2.5 text-right">Status / P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((b) => (
                  <tr key={b.id} className="border-t border-line">
                    <td className="px-4 py-2.5 font-semibold text-ink">{b.username}</td>
                    <td className="px-4 py-2.5 text-muted">{b.matchTitle}</td>
                    <td className="px-4 py-2.5 text-ink/80">{b.selectionName}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-ink">{coins(b.stake)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted">{b.rate.toFixed(2)}x</td>
                    <td className="px-4 py-2.5 text-[12px] text-muted">{fmtDateTime(b.placedAt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${TONE[b.status]}`}>
                        {b.status === "void" ? b.voidReason ?? "refund" : b.status}
                      </span>
                      {b.status === "won" || b.status === "lost" ? (
                        <span className={`ml-2 font-bold tabular-nums ${b.resultPl >= 0 ? "text-emerald-600" : "text-lay"}`}>
                          {signed(b.resultPl)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
