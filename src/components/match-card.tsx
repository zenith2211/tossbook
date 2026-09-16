"use client";

import { useActionState, useEffect, useState } from "react";
import { placeBetAction } from "@/lib/actions/bet-actions";
import { Banner, SubmitButton } from "./form";
import { Badge } from "./ui";
import { coins, fmtDateTime, fmtTime, round2 } from "@/lib/format";
import { IconCricket, IconTrophy } from "./icons";

type MarketDTO = {
  id: number;
  type: "toss" | "match_winner";
  name: string;
  status: "open" | "suspended" | "closed" | "settled";
  rate_a: number;
  rate_b: number;
  min_stake: number;
  max_stake: number;
  result: "A" | "B" | "void" | null;
};

export type MatchDTO = {
  id: number;
  title: string;
  team_a: string;
  team_b: string;
  league: string;
  status: "upcoming" | "live" | "closed" | "settled";
  start_time: string;
  end_time: string | null;
  markets: MarketDTO[];
};

const QUICK = [100, 500, 1000, 5000, 25000];

export function MatchCard({
  match,
  available,
  backed = {},
}: {
  match: MatchDTO;
  available: number;
  backed?: Record<number, "A" | "B">;
}) {
  const [sel, setSel] = useState<{ marketId: number; selection: "A" | "B"; rate: number; label: string } | null>(null);
  const [stake, setStake] = useState<string>("");
  const [now, setNow] = useState<number | null>(null);
  const [state, formAction] = useActionState(placeBetAction, { ok: false });

  useEffect(() => {
    if (state.ok) {
      setSel(null);
      setStake("");
    }
  }, [state]);

  // Live betting-cutoff check (starts null so server & first client render match).
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);
  const bettingClosed =
    match.end_time != null && now != null && now >= new Date(match.end_time).getTime();

  useEffect(() => {
    if (bettingClosed) setSel(null);
  }, [bettingClosed]);

  const stakeNum = Number(stake.replace(/,/g, "")) || 0;
  const profit = sel ? round2(stakeNum * (sel.rate - 1)) : 0;

  return (
    <div className="card-shadow overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-panel-2/70 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-brand"><IconCricket className="h-4 w-4" /></span>
          <span className="text-xs font-semibold text-muted">{match.league}</span>
        </div>
        <div className="flex items-center gap-2">
          {match.end_time && !bettingClosed ? (
            <span className="text-[11px] font-semibold text-muted">Closes {fmtTime(match.end_time)}</span>
          ) : null}
          {bettingClosed ? (
            <Badge tone="danger">Betting closed</Badge>
          ) : match.status === "live" ? (
            <Badge tone="live">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lay" /> LIVE
            </Badge>
          ) : match.status === "settled" ? (
            <Badge tone="muted">Settled</Badge>
          ) : (
            <Badge tone="muted">{fmtDateTime(match.start_time)}</Badge>
          )}
        </div>
      </div>

      <div className="px-4 py-3">
        <h3 className="mb-3 text-base font-extrabold text-ink">{match.title}</h3>

        {match.markets.map((mk) => {
          const marketClosed =
            mk.status !== "open" || match.status === "settled" || match.status === "closed" || bettingClosed;
          const backedSide = backed[mk.id];
          return (
            <div key={mk.id} className="mb-3 last:mb-0">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink/70">
                {mk.type === "toss" ? <IconCricket className="h-3.5 w-3.5" /> : <IconTrophy className="h-3.5 w-3.5" />}
                {mk.name}
                {mk.status === "suspended" ? <Badge tone="danger">Suspended</Badge> : null}
                {mk.status === "settled" ? (
                  <Badge tone="brand">
                    Won: {mk.result === "A" ? match.team_a : mk.result === "B" ? match.team_b : "Void"}
                  </Badge>
                ) : backedSide ? (
                  <Badge tone="brand">Backed {backedSide === "A" ? match.team_a : match.team_b}</Badge>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["A", "B"] as const).map((side) => {
                  const rate = side === "A" ? mk.rate_a : mk.rate_b;
                  const team = side === "A" ? match.team_a : match.team_b;
                  const isSel = sel?.marketId === mk.id && sel.selection === side;
                  const isWinner = mk.status === "settled" && mk.result === side;
                  // one-sided rule: block the opposite team once a side is backed
                  const lockedOut = !!backedSide && backedSide !== side;
                  const disabled = marketClosed || lockedOut;
                  return (
                    <button
                      key={side}
                      disabled={disabled}
                      title={lockedOut ? "You already backed the other team in this market" : undefined}
                      onClick={() =>
                        setSel(isSel ? null : { marketId: mk.id, selection: side, rate, label: `${team} · ${mk.name}` })
                      }
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        isSel
                          ? "border-brand bg-brand/10 ring-2 ring-brand/20"
                          : isWinner || backedSide === side
                            ? "border-brand/40 bg-brand/5"
                            : "border-line bg-back/5 hover:border-back/40"
                      }`}
                    >
                      <span className="truncate text-sm font-bold text-ink">{team}</span>
                      <span className={`ml-2 tabular-nums text-sm font-extrabold ${isSel ? "text-brand" : "text-back"}`}>
                        {rate.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {sel ? (
        <form action={formAction} className="border-t border-line bg-panel-2/70 px-4 py-3">
          <input type="hidden" name="marketId" value={sel.marketId} />
          <input type="hidden" name="selection" value={sel.selection} />
          <input type="hidden" name="stake" value={stakeNum} />
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-brand">{sel.label}</span>
            <span className="text-muted">@ {sel.rate.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              inputMode="numeric"
              value={stake}
              onChange={(e) => setStake(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Stake amount"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <SubmitButton>Place</SubmitButton>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setStake(String((Number(stake) || 0) + q))}
                className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink/70 hover:border-brand/40 hover:text-ink"
              >
                +{coins(q)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setStake("")}
              className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-muted hover:text-ink"
            >
              Clear
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted">
              Returns: <span className="font-bold text-brand">{coins(round2(stakeNum * sel.rate))}</span>
              <span className="ml-1 text-[11px] text-muted">(profit {coins(profit)})</span>
            </span>
            <span className="text-muted">
              Bal: <span className="font-bold text-gold">{coins(available)}</span>
            </span>
          </div>
          <div className="mt-2">
            <Banner state={state} />
          </div>
        </form>
      ) : state.ok && state.message ? (
        <div className="border-t border-line px-4 py-2">
          <Banner state={state} />
        </div>
      ) : null}
    </div>
  );
}
