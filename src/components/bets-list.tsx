"use client";

import { useMemo, useState } from "react";
import { Card, Badge, Empty, PnL, Stat } from "./ui";
import { coins, fmtDateTime } from "@/lib/format";

export type BetItem = {
  id: number;
  match_title: string;
  selection_name: string;
  market_type: "toss" | "match_winner";
  stake: number;
  rate: number;
  potential_win: number;
  status: "open" | "won" | "lost" | "void";
  result_pl: number;
  placed_at: string;
  settled_at: string | null;
};

const FILTERS = ["All", "Live", "Won", "Lost", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(b: BetItem, f: Filter): boolean {
  if (f === "All") return true;
  if (f === "Live") return b.status === "open";
  if (f === "Won") return b.status === "won";
  if (f === "Lost") return b.status === "lost";
  return b.status === "void";
}

function statusBadge(s: string) {
  if (s === "open") return <Badge tone="gold">Open</Badge>;
  if (s === "won") return <Badge tone="brand">Won</Badge>;
  if (s === "lost") return <Badge tone="lay">Lost</Badge>;
  return <Badge tone="muted">Void</Badge>;
}

export function BetsList({ bets }: { bets: BetItem[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [q, setQ] = useState("");

  const totals = useMemo(() => {
    const open = bets.filter((b) => b.status === "open");
    return {
      live: open.length,
      won: bets.filter((b) => b.status === "won").length,
      lost: bets.filter((b) => b.status === "lost").length,
      invested: open.reduce((s, b) => s + b.stake, 0),
    };
  }, [bets]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return bets.filter(
      (b) =>
        matchesFilter(b, filter) &&
        (needle === "" ||
          b.match_title.toLowerCase().includes(needle) ||
          b.selection_name.toLowerCase().includes(needle)),
    );
  }, [bets, filter, q]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Live" value={totals.live} accent={totals.live ? "text-gold" : ""} />
        <Stat label="Won" value={totals.won} accent={totals.won ? "text-brand" : ""} />
        <Stat label="Lost" value={totals.lost} accent={totals.lost ? "text-lay" : ""} />
        <Stat label="Invested" value={coins(totals.invested)} />
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search match or team…"
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
        {filtered.length === 0 ? (
          <Empty>No bets match this view.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((b) => (
              <li key={b.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="truncate">{b.selection_name}</span>
                    {statusBadge(b.status)}
                  </div>
                  <div className="truncate text-xs text-muted">
                    {b.match_title} · {b.market_type === "toss" ? "Toss" : "Match"} @ {b.rate.toFixed(2)}
                    {" · "}
                    {fmtDateTime(b.status === "open" ? b.placed_at : b.settled_at ?? b.placed_at)}
                  </div>
                </div>
                <div className="ml-3 text-right">
                  {b.status === "open" ? (
                    <>
                      <div className="text-sm font-bold tabular-nums">{coins(b.stake)}</div>
                      <div className="text-xs text-brand">returns {coins(b.stake * b.rate)}</div>
                    </>
                  ) : b.status === "void" ? (
                    <div className="text-sm text-muted">Returned {coins(b.stake)}</div>
                  ) : (
                    <>
                      <PnL value={b.result_pl} />
                      <div className="text-xs text-muted">stake {coins(b.stake)}</div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
