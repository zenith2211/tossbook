"use client";

import { useMemo, useState } from "react";
import { Card, CardHead, Badge, Empty } from "./ui";
import { coins, fmtDateTime } from "@/lib/format";
import { IconTrophy } from "./icons";

export type ResultItem = {
  market_id: number;
  title: string;
  team_a: string;
  team_b: string;
  league: string;
  name: string;
  result: "A" | "B" | "void" | null;
  settled_at: string | null;
  bets: number;
  volume: number;
};

const FILTERS = ["All", "Settled", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

export function ResultsList({ results }: { results: ResultItem[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return results.filter((r) => {
      const okFilter =
        filter === "All" || (filter === "Cancelled" ? r.result === "void" : r.result !== "void");
      const okSearch =
        needle === "" ||
        r.title.toLowerCase().includes(needle) ||
        r.league.toLowerCase().includes(needle);
      return okFilter && okSearch;
    });
  }, [results, filter, q]);

  return (
    <div className="space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search teams or tournament…"
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

      {filtered.length === 0 ? (
        <Card>
          <CardHead title="No results" />
          <Empty>Nothing matches this view yet.</Empty>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const winnerName = r.result === "A" ? r.team_a : r.result === "B" ? r.team_b : "Void";
            return (
              <Card key={r.market_id}>
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                  <span className="text-xs font-medium text-muted">{r.league}</span>
                  {r.result === "void" ? <Badge tone="lay">Cancelled</Badge> : <Badge tone="brand">Settled</Badge>}
                </div>
                <div className="px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-bold">{r.title}</h3>
                    <span className="text-xs text-muted">{r.settled_at ? fmtDateTime(r.settled_at) : ""}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["A", "B"] as const).map((side) => {
                      const team = side === "A" ? r.team_a : r.team_b;
                      const won = r.result === side;
                      return (
                        <div
                          key={side}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                            won ? "border-brand bg-brand/10" : "border-line opacity-70"
                          }`}
                        >
                          <span className="text-sm font-semibold">{team}</span>
                          {won ? <IconTrophy className="h-4 w-4 text-brand" /> : null}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {r.name} ·{" "}
                    {r.result === "void" ? (
                      "Market voided — stakes returned."
                    ) : (
                      <>
                        Winner: <span className="font-semibold text-brand">{winnerName}</span>
                      </>
                    )}{" "}
                    · {r.bets} bet(s) · {coins(r.volume)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
