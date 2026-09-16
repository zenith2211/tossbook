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
  image_url: string | null;
  markets: MarketDTO[];
};

const QUICK = [100, 500, 1000, 5000, 25000];
const PCTS = [10, 50, 100];

/** Format a millisecond duration as HH:MM:SS (clamped at zero). */
function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

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
  const [placed, setPlaced] = useState<{ label: string; rate: number; stake: number } | null>(null);
  const [state, formAction] = useActionState(placeBetAction, { ok: false });

  useEffect(() => {
    if (state.ok) {
      // Snapshot the just-placed pick for the confirmation modal before clearing.
      if (sel && Number(stake.replace(/,/g, "")) > 0) {
        setPlaced({ label: sel.label, rate: sel.rate, stake: Number(stake.replace(/,/g, "")) });
      }
      setSel(null);
      setStake("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Live clock — starts null so the server and first client render agree, then
  // ticks every second to drive the closing countdown.
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const bettingClosed =
    match.end_time != null && now != null && now >= new Date(match.end_time).getTime();
  const countdown =
    match.end_time != null && now != null && !bettingClosed
      ? fmtCountdown(new Date(match.end_time).getTime() - now)
      : null;

  useEffect(() => {
    if (bettingClosed) setSel(null);
  }, [bettingClosed]);

  const stakeNum = Number(stake.replace(/,/g, "")) || 0;
  const profit = sel ? round2(stakeNum * (sel.rate - 1)) : 0;

  return (
    <div className="card-shadow overflow-hidden rounded-2xl border border-line bg-panel">
      {match.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={match.image_url}
          alt={`${match.title} poster`}
          className="h-36 w-full border-b border-line object-cover"
        />
      ) : null}
      <div className="flex items-center justify-between gap-2 border-b border-line bg-panel-2/70 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-brand"><IconCricket className="h-4 w-4" /></span>
          <span className="text-xs font-semibold text-muted">{match.league}</span>
        </div>
        <div className="flex items-center gap-2">
          {match.end_time && !bettingClosed ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-line bg-panel px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {countdown != null ? countdown : `Closes ${fmtTime(match.end_time)}`}
            </span>
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
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Balance</span>
            {PCTS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={available <= 0}
                onClick={() => setStake(String(Math.floor((available * p) / 100)))}
                className="rounded-md border border-brand/30 bg-brand/5 px-2.5 py-1 text-xs font-bold text-brand transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {p === 100 ? "Max" : `${p}%`}
              </button>
            ))}
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

      {placed ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={() => setPlaced(null)}
        >
          <div
            className="card-shadow w-full max-w-sm rounded-2xl border border-line bg-panel p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-3xl">🎉</div>
            <h3 className="text-center text-lg font-extrabold text-ink">Pick Placed!</h3>
            <p className="mb-4 text-center text-xs text-muted">{placed.label}</p>
            <div className="space-y-2 rounded-xl border border-line bg-panel-2 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Stake</span>
                <span className="font-bold tabular-nums text-ink">{coins(placed.stake)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Odds</span>
                <span className="font-bold tabular-nums text-ink">{placed.rate.toFixed(2)}×</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Potential win</span>
                <span className="font-extrabold tabular-nums text-brand">{coins(round2(placed.stake * placed.rate))}</span>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-muted">
              Results settle after the toss. Check <b>My Bets</b> for updates.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlaced(null)}
                className="rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-ink/80 transition hover:border-brand/40"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setPlaced(null)}
                className="rounded-xl bg-brand px-3 py-2.5 text-sm font-bold text-white transition hover:bg-brand-2"
              >
                Bet more
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
