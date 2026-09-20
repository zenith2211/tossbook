"use client";

import { useEffect, useState, useTransition } from "react";
import { placeBetAction } from "@/lib/actions/bet-actions";
import { coins, round2 } from "@/lib/format";
import { useToast } from "./toast";
import { IconBolt, IconCheckCircle, IconTrendUp, IconWallet, IconX } from "@/components/icons";

/** Fixed stake buttons, then three balance percentages — as on the sheet. */
const QUICK = [100, 500, 2500, 10000, 20000, 50000];
const PCTS = [10, 50, 100];

export interface PickTarget {
  marketId: number;
  teamA: string;
  teamB: string;
  rateA: number;
  rateB: number;
  minStake: number;
  maxStake: number;
  side: "A" | "B";
  /** Side already backed on this market — the other one is locked out. */
  lockedTo?: "A" | "B";
  phaseLabel: string;
}

export interface PlacedPick {
  teamName: string;
  matchTitle: string;
  stake: number;
  rate: number;
}

export function PickModal({
  target,
  matchTitle,
  available,
  onClose,
  onPlaced,
}: {
  target: PickTarget;
  matchTitle: string;
  available: number;
  onClose: () => void;
  onPlaced: (p: PlacedPick) => void;
}) {
  const [side, setSide] = useState<"A" | "B">(target.side);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const rate = side === "A" ? target.rateA : target.rateB;
  const teamName = side === "A" ? target.teamA : target.teamB;
  const stake = Number(amount) || 0;
  const profit = round2(stake * (rate - 1));
  const ready = stake > 0 && !pending;

  function choose(next: "A" | "B") {
    if (target.lockedTo && target.lockedTo !== next) return;
    setSide(next);
    setError("");
  }

  function submit() {
    if (stake < target.minStake) return setError(`Minimum pick is ${coins(target.minStake)}.`);
    if (stake > target.maxStake) return setError(`Maximum pick is ${coins(target.maxStake)}.`);
    if (stake > available) return setError("That is more than your available balance.");

    const fd = new FormData();
    fd.set("marketId", String(target.marketId));
    fd.set("selection", side);
    fd.set("stake", String(stake));

    start(async () => {
      const r = await placeBetAction({ ok: false }, fd);
      if (!r.ok) {
        setError(r.error ?? "Could not place the pick.");
        return;
      }
      toast.notify("Bet placed successfully!", `You bet ${coins(stake)} on ${teamName}`);
      toast.money(-stake, "Balance Deducted");
      onPlaced({ teamName, matchTitle, stake, rate });
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-3 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Place your pick"
    >
      <div
        className="animate-pop-in card-shadow max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-panel p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              {target.phaseLabel} · {matchTitle}
            </p>
            <h2 className="font-display text-xl font-extrabold text-ink">Place Your Pick</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/35 bg-brand/5 px-2.5 py-1.5 text-[12px] font-bold tabular-nums text-brand sm:px-3">
              <IconWallet className="h-3.5 w-3.5 shrink-0" />
              {coins(available)}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel-2 text-muted transition hover:text-ink"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Side picker */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {(["A", "B"] as const).map((s) => {
            const name = s === "A" ? target.teamA : target.teamB;
            const r = s === "A" ? target.rateA : target.rateB;
            const on = side === s;
            const locked = !!target.lockedTo && target.lockedTo !== s;
            return (
              <button
                key={s}
                type="button"
                disabled={locked}
                onClick={() => choose(s)}
                title={locked ? "You already backed the other team" : undefined}
                className={`relative flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                  on ? "border-purple/50 bg-purple/8 ring-2 ring-purple/25" : "border-line bg-panel-2 hover:border-purple/30"
                }`}
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[11px] font-extrabold uppercase ${
                    on ? "bg-purple/15 text-purple ring-2 ring-purple/50" : "bg-panel text-muted ring-1 ring-line"
                  }`}
                >
                  {name.slice(0, 3)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold text-muted">Team {s}</span>
                  <span className="block truncate text-sm font-bold text-ink">{name}</span>
                  <span className={`block text-[13px] font-extrabold ${on ? "text-purple" : "text-purple/55"}`}>
                    {r.toFixed(2)}x
                  </span>
                </span>
                {on ? (
                  <IconCheckCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-purple" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Quick amounts */}
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Quick amounts</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setAmount(String(q));
                setError("");
              }}
              className="rounded-xl border border-line bg-panel-2 py-2.5 text-[13px] font-bold text-ink/80 transition hover:border-brand/40 hover:text-brand"
            >
              {coins(q)}
            </button>
          ))}
          {PCTS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={available <= 0}
              onClick={() => {
                setAmount(String(Math.floor((available * p) / 100)));
                setError("");
              }}
              className="rounded-xl border border-line bg-panel-2 py-2.5 text-[13px] font-bold text-ink/80 transition hover:border-brand/40 hover:text-brand disabled:opacity-45"
            >
              %{p}
            </button>
          ))}
        </div>

        {/* Amount */}
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Enter amount</p>
        <div className="relative mt-2">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-muted">₹</span>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^0-9]/g, ""));
              setError("");
            }}
            placeholder="0"
            aria-label="Pick amount"
            className="w-full rounded-2xl border-2 border-line bg-panel-2 py-3.5 pl-9 pr-20 text-lg font-bold text-ink outline-none transition placeholder:text-muted/70 focus:border-brand/50 focus:bg-panel focus:ring-4 focus:ring-brand/10"
          />
          {amount ? (
            <button
              type="button"
              onClick={() => setAmount("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-line bg-panel px-3 py-1 text-[11px] font-semibold text-muted transition hover:text-ink"
            >
              clear
            </button>
          ) : null}
        </div>

        {/* Payout preview */}
        {stake > 0 ? (
          <div className="animate-slide-down mt-3 grid grid-cols-3 gap-2">
            <Tile label="₹ Stake" value={coins(stake)} />
            <Tile label="↗ Profit" value={coins(profit)} tone="green" />
            <Tile label="↗ Return" value={coins(round2(stake * rate))} tone="green" />
          </div>
        ) : null}

        {error ? <p className="mt-3 text-[13px] font-semibold text-lay">{error}</p> : null}

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              setAmount("");
              setError("");
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-line bg-panel-2 px-5 py-3.5 text-sm font-bold text-ink/70 transition hover:text-ink"
          >
            <Reset /> Reset
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={submit}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition ${
              ready
                ? "bg-teal-cta text-white glow-brand hover:brightness-110"
                : "cursor-not-allowed border border-line bg-panel-2 text-muted"
            }`}
          >
            <IconBolt className="h-4 w-4" />
            {pending ? "Placing…" : `Play — ${coins(stake)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  return (
    <div className="rounded-xl border border-line bg-panel-2 px-2.5 py-2.5 text-center">
      <div className="truncate text-[10px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className={`font-display text-[15px] font-extrabold tabular-nums ${tone === "green" ? "text-emerald-600" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

function Reset() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
    </svg>
  );
}

/** Confirmation sheet shown straight after a pick lands. */
export function PickPlacedModal({
  pick,
  onClose,
  onPlayMore,
}: {
  pick: PlacedPick;
  onClose: () => void;
  onPlayMore: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-3 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-pop-in card-shadow w-full max-w-sm rounded-3xl border border-line bg-panel p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-line bg-panel-2 text-muted transition hover:text-ink"
        >
          <IconX className="h-4 w-4" />
        </button>

        <div className="mx-auto mt-1 grid h-16 w-16 place-items-center rounded-full bg-purple/12 text-3xl">🎉</div>
        <h2 className="font-display mt-3 text-center text-2xl font-extrabold text-ink">Pick Placed! 🎉</h2>
        <p className="text-center text-[13px] text-muted">{pick.matchTitle}</p>

        <dl className="mt-4 overflow-hidden rounded-2xl border border-line">
          <Row label="Your Pick" value={<span className="font-bold text-purple">{pick.teamName}</span>} />
          <Row label="Stake Amount" value={coins(pick.stake)} />
          <Row label="Odds" value={`${pick.rate.toFixed(2)}x`} />
          <Row
            label="Potential Win"
            value={<span className="font-extrabold text-emerald-600">{coins(round2(pick.stake * pick.rate))}</span>}
            last
          />
        </dl>

        <p className="mt-3 text-center text-[12px] text-muted">
          Results settle after the toss. Check <b className="text-ink">My Picks</b> for updates.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-line bg-panel-2 px-4 py-3 text-sm font-bold text-ink/70 transition hover:text-ink"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onPlayMore}
            className="bg-teal-cta inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-bold text-white transition hover:brightness-110"
          >
            <span className="text-base leading-none">+</span> Play More
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 bg-panel-2/60 px-3.5 py-2.5 ${last ? "" : "border-b border-line"}`}>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="text-[14px] font-bold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

export { IconTrendUp };
