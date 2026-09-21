"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { coins, fmtTime, round2 } from "@/lib/format";
import { PickModal, PickPlacedModal, type PickTarget, type PlacedPick } from "./pick-modal";
import { CancelPickButton } from "./cancel-pick";
import { IconBell, IconBolt, IconLock, IconPlus, IconXCircle } from "@/components/icons";

export interface PlayMarketDTO {
  id: number;
  rateA: number;
  rateB: number;
  minStake: number;
  maxStake: number;
  open: boolean;
}

export interface MyPickDTO {
  betId: number;
  side: "A" | "B";
  stake: number;
  rate: number;
}

export interface PlayMatchDTO {
  id: number;
  title: string;
  league: string;
  teamA: string;
  teamB: string;
  status: "upcoming" | "live" | "closed" | "settled";
  startTime: string;
  endTime: string | null;
  imageUrl: string | null;
  market: PlayMarketDTO | null;
  /** Everything this client already has running on the match. */
  picks: MyPickDTO[];
}

/** "00H 04M 55S", clamped at zero. */
function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}H ${pad(Math.floor((s % 3600) / 60))}M ${pad(s % 60)}S`;
}

export function PlayMatchCard({ match, available }: { match: PlayMatchDTO; available: number }) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const [target, setTarget] = useState<PickTarget | null>(null);
  const [placed, setPlaced] = useState<PlacedPick | null>(null);
  const [reminder, setReminder] = useState(false);

  // Null on the first render so server and client markup agree, then ticks.
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const closesAt = match.endTime ? new Date(match.endTime).getTime() : null;
  const closed = closesAt !== null && now !== null && now >= closesAt;
  const countdown = closesAt !== null && now !== null && !closed ? fmtCountdown(closesAt - now) : null;

  const market = match.market;
  const canPick = !!market && market.open && !closed && match.status !== "settled" && match.status !== "closed";

  const myStake = match.picks.reduce((s, p) => s + p.stake, 0);
  const mySide = match.picks[0]?.side;
  const myRate = match.picks[0]?.rate ?? market?.rateA ?? 1.95;
  const myWin = round2(myStake * myRate);

  function openPicker(side: "A" | "B") {
    if (!market || !canPick) return;
    setTarget({
      marketId: market.id,
      teamA: match.teamA,
      teamB: match.teamB,
      rateA: market.rateA,
      rateB: market.rateB,
      minStake: market.minStake,
      maxStake: market.maxStake,
      side,
      lockedTo: mySide,
      phaseLabel: match.status === "live" ? "LIVE" : "UPCOMING",
    });
  }

  return (
    <article className="card-topline card-shadow card-hover relative overflow-hidden rounded-2xl border border-line bg-panel">
      {match.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={match.imageUrl} alt="" className="h-32 w-full border-b border-line object-cover" />
      ) : null}

      <div className="p-4 pt-5">
        {/* Countdown + reminder bell */}
        <div className="flex items-center justify-between gap-3">
          {closed ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold uppercase text-muted">
              <IconLock className="h-4 w-4" /> Picks closed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-wide text-lay">
              <span className="text-base leading-none">🌙</span>
              {countdown ?? (match.endTime ? fmtTime(match.endTime) : "Open")}
            </span>
          )}
          <button
            type="button"
            onClick={() => setReminder((r) => !r)}
            aria-label={reminder ? "Reminder on" : "Remind me"}
            aria-pressed={reminder}
            className={`grid h-8 w-8 place-items-center rounded-full transition ${
              reminder ? "bg-gold/15 text-gold" : "text-muted hover:bg-panel-2 hover:text-ink"
            }`}
          >
            <IconBell className="h-[18px] w-[18px]" />
          </button>
        </div>

        <p className="mt-2 text-[13px] font-bold text-ink">{match.league}</p>

        {/* Team rows */}
        <div className="mt-2.5">
          <TeamRow
            name={match.teamA}
            mine={mySide === "A"}
            stake={mySide === "A" ? myStake : 0}
            canPick={canPick && (!mySide || mySide === "A")}
            onChoose={() => openPicker("A")}
          />

          <div className="relative my-3 flex items-center justify-center">
            <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
            <span className="relative grid h-9 w-9 place-items-center rounded-full border border-line bg-panel text-[11px] font-bold text-muted">
              vs
            </span>
          </div>

          <TeamRow
            name={match.teamB}
            mine={mySide === "B"}
            stake={mySide === "B" ? myStake : 0}
            canPick={canPick && (!mySide || mySide === "B")}
            onChoose={() => openPicker("B")}
          />
        </div>

        {/* Locked summary once the client has money on the match */}
        {myStake > 0 ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-purple/25 bg-purple/8 px-3.5 py-2.5">
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                <IconLock className="h-3.5 w-3.5" /> Bet locked
              </span>
              <span className="block text-[13px] font-bold text-ink">
                {coins(myStake)} · Win {coins(myWin)}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Profit</span>
              <span className="block text-[13px] font-extrabold text-emerald-600">+{coins(round2(myWin - myStake))}</span>
            </span>
          </div>
        ) : null}

        {/* Facts */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <Fact label="Endtime" value={match.endTime ? fmtTime(match.endTime) : "—"} />
          <Fact label="Toss rate" value={`${(market?.rateA ?? 1.95).toFixed(2)}x`} />
        </div>

        {/* Actions */}
        <div className="mt-3">
          {!canPick ? (
            <p className="rounded-2xl border border-line bg-panel-2 py-3 text-center text-[13px] font-semibold text-muted">
              {closed ? "Picks are closed for this match." : "This market is not open."}
            </p>
          ) : myStake > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => openPicker(mySide ?? "A")}
                className="bg-grape inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition hover:brightness-110 glow-play"
              >
                <IconPlus className="h-4 w-4" /> Bet more
              </button>
              <CancelPickButton
                betId={match.picks[0].betId}
                onDone={() => router.refresh()}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-lay/35 bg-lay/5 px-4 py-3.5 text-sm font-extrabold uppercase tracking-wide text-lay transition hover:bg-lay/10"
              >
                <IconXCircle className="h-4 w-4" /> Cancel
              </CancelPickButton>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openPicker("A")}
              className="bg-grape glow-play inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-extrabold uppercase tracking-[0.06em] text-white transition hover:brightness-110"
            >
              <IconBolt className="h-4 w-4" /> Bet &amp; Play
            </button>
          )}
        </div>
      </div>

      {target ? (
        <PickModal
          target={target}
          matchTitle={`${match.teamA} vs ${match.teamB}`}
          available={available}
          onClose={() => setTarget(null)}
          onPlaced={(p) => {
            setTarget(null);
            setPlaced(p);
            router.refresh();
          }}
        />
      ) : null}

      {placed ? (
        <PickPlacedModal
          pick={placed}
          onClose={() => setPlaced(null)}
          onPlayMore={() => {
            setPlaced(null);
            openPicker(mySide ?? "A");
          }}
        />
      ) : null}
    </article>
  );
}

function TeamRow({
  name,
  mine,
  stake,
  canPick,
  onChoose,
}: {
  name: string;
  mine: boolean;
  stake: number;
  canPick: boolean;
  onChoose: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3.5 transition ${
        mine ? "border-purple/30 bg-purple/8" : "border-line bg-panel-2"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-bold uppercase tracking-wide text-ink">{name}</span>
        {mine ? (
          <span className="shrink-0 rounded-full bg-purple/15 px-2 py-0.5 text-[10px] font-bold uppercase text-purple">
            Your pick
          </span>
        ) : null}
      </span>

      {stake > 0 ? (
        <span className="shrink-0 text-sm font-bold tabular-nums text-ink">{coins(stake)}</span>
      ) : canPick ? (
        <button
          type="button"
          onClick={onChoose}
          className="bg-grape shrink-0 rounded-full px-4 py-1.5 text-[12px] font-bold text-white transition hover:brightness-110"
        >
          Choose
        </button>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel-2 px-3.5 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className="font-display text-base font-extrabold text-ink">{value}</div>
    </div>
  );
}
