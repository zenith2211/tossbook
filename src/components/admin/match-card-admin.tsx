"use client";

import { useState } from "react";
import { coins, fmtDateTime, fmtTime, signed } from "@/lib/format";
import {
  cancelMatchAction,
  declareTossAction,
  deleteMatchesAction,
  goLiveAction,
} from "@/lib/actions/admin-actions";
import { useAction } from "./use-action";
import { EditMatchModal } from "./match-forms";
import { Avatar, btnCls } from "./kit";
import { PHASE_TONE, type MatchCardView } from "./match-view";
import {
  IconCalendar,
  IconCheckCircle,
  IconChevronDown,
  IconClock,
  IconDot,
  IconEye,
  IconTrash,
  IconTrendUp,
  IconTrophy,
  IconUsers,
  IconXCircle,
} from "@/components/icons";

export function MatchCardAdmin({
  m,
  selected,
  onSelect,
}: {
  m: MatchCardView;
  selected: boolean;
  onSelect: (id: number, on: boolean) => void;
}) {
  const [panel, setPanel] = useState<"none" | "pnl" | "bets">("none");
  const [confirm, setConfirm] = useState<null | { kind: "A" | "B" | "cancel" | "delete" }>(null);

  const declare = useAction(declareTossAction);
  const cancel = useAction(cancelMatchAction);
  const remove = useAction(deleteMatchesAction);
  const live = useAction(goLiveAction);
  const busy = declare.pending || cancel.pending || remove.pending || live.pending;
  const feedback = declare.result ?? cancel.result ?? remove.result ?? live.result;

  const tone = PHASE_TONE[m.phase];
  const pctA = m.totalStake > 0 ? (m.stakeA / m.totalStake) * 100 : 0;
  // Picks have closed on the clock but no winner has been declared yet — the
  // admin still needs to settle it, so keep the result buttons in reach.
  const awaitingResult = m.phase === "closed" && !m.settled;
  const canGoLive = !m.settled && (m.phase === "pending" || m.phase === "upcoming");

  const CONFIRM_COPY: Record<string, string> = {
    A: `Declare ${m.teamA} as the toss winner?`,
    B: `Declare ${m.teamB} as the toss winner?`,
    cancel: "Cancel this match and refund every open pick?",
    delete: "Delete this match for good? Open picks are refunded and the card disappears.",
  };

  function runConfirmed(kind: "A" | "B" | "cancel" | "delete") {
    const done = () => setConfirm(null);
    if (kind === "cancel") return cancel.run({ matchId: m.id }, done);
    if (kind === "delete") return remove.run({ matchIds: String(m.id) }, done);
    return declare.run({ matchId: m.id, side: kind }, done);
  }

  function toggle(next: "pnl" | "bets") {
    setPanel((p) => (p === next ? "none" : next));
  }

  return (
    <article className="card-shadow overflow-hidden rounded-2xl border border-line bg-panel">
      {/* Fixture strip — poster, both teams and the scheduled start. */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        {m.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-line object-cover" />
        ) : null}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Avatar name={m.teamA} className="h-7 w-7 text-xs" />
            <span className="truncate font-display text-[15px] font-bold text-ink">{m.teamA}</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar name={m.teamB} className="h-7 w-7 text-xs" />
            <span className="truncate font-display text-[15px] font-bold text-muted">{m.teamB}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] text-muted">Starts at:</div>
          <div className="font-display text-lg font-bold text-ink">{fmtTime(m.startTime)}</div>
        </div>
      </div>

      <div className="p-4">
        {/* Heading row: select, league, title, status, panel toggles. */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(m.id, e.target.checked)}
              aria-label={`Select ${m.title}`}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
            />
            <div className="min-w-0">
              <div className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-brand">{m.league}</div>
              <h3 className="font-display truncate text-lg font-extrabold leading-tight text-ink">{m.title}</h3>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone.chip}`}>
                  <IconDot className={`h-1.5 w-1.5 ${m.phase === "live" ? "animate-pulse-soft" : ""}`} />
                  {tone.label}
                </span>
                {m.winner ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold">
                    <IconTrophy className="h-3 w-3" /> {m.winner} Won
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            <button type="button" onClick={() => toggle("pnl")} className={btnCls("neutral", "px-2.5 py-1.5")}>
              <IconBarsSmall />
              P&amp;L
              <IconChevronDown className={`h-3.5 w-3.5 transition ${panel === "pnl" ? "rotate-180" : ""}`} />
            </button>
            <button type="button" onClick={() => toggle("bets")} className={btnCls("neutral", "px-2.5 py-1.5")}>
              <IconEye className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">View Bets ({m.totalBets})</span>
            </button>
          </div>
        </div>

        {/* Facts line. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <IconCalendar className="h-3.5 w-3.5" />
            {fmtDateTime(m.startTime)}
          </span>
          <span>
            Odds: <b className="text-ink">{m.rateA}x</b> / <b className="text-ink">{m.rateB}x</b>
          </span>
          <span>
            Max: <b className="text-ink">{coins(m.maxStake)}</b>
          </span>
        </div>

        {/* Auto-status times. */}
        {m.liveTime || m.endTime ? (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {m.liveTime ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600">
                <IconClock className="h-3.5 w-3.5" /> Live: {fmtDateTime(m.liveTime)}
              </span>
            ) : null}
            {m.endTime ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-lay/35 bg-lay/5 px-2.5 py-1.5 text-[11px] font-semibold text-lay">
                <IconClock className="h-3.5 w-3.5" /> Closes: {fmtDateTime(m.endTime)}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Volume + split bar. */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="inline-flex items-center gap-1.5 text-muted">
              <IconUsers className="h-3.5 w-3.5" />
              {m.totalBets} bet{m.totalBets === 1 ? "" : "s"} · <b className="text-ink">{coins(m.totalStake)}</b>
            </span>
            <span className="text-[11px] text-muted">
              {m.teamA}: {m.betsA} · {m.teamB}: {m.betsB}
            </span>
          </div>
          <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-panel-2">
            {m.totalStake > 0 ? (
              <>
                <span className="bg-brand" style={{ width: `${pctA}%` }} />
                <span className="bg-lay" style={{ width: `${100 - pctA}%` }} />
              </>
            ) : null}
          </div>
        </div>

        {/* Expandable P&L breakdown. */}
        {panel === "pnl" ? <PnlPanel m={m} /> : null}

        {/* Expandable bet list. */}
        {panel === "bets" ? <BetsPanel m={m} /> : null}

        {/* Controls. */}
        <div className="mt-4 border-t border-line pt-3">
          {confirm ? (
            <div className="rounded-xl border border-gold/35 bg-gold/5 px-3 py-2.5">
              <p className="text-[13px] font-semibold text-ink">{CONFIRM_COPY[confirm.kind]}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runConfirmed(confirm.kind)}
                  className={btnCls(confirm.kind === "A" ? "primary" : "red", "flex-1 px-3 py-2 sm:flex-none")}
                >
                  {busy ? "Working…" : "Yes, confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  className={btnCls("neutral", "flex-1 px-3 py-2 sm:flex-none")}
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <>
              {awaitingResult ? (
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-gold">
                  <IconWarnSmall /> Picks closed — settle the result:
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {canGoLive ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => live.run({ matchId: m.id })}
                    className={btnCls("red", "px-3 py-2")}
                  >
                    <IconDot className="h-1.5 w-1.5" /> {live.pending ? "Going live…" : "Go Live"}
                  </button>
                ) : null}

                <EditMatchModal m={m} />

                {m.settled ? null : (
                  <>
                    <button type="button" onClick={() => setConfirm({ kind: "A" })} className={btnCls("green", "px-3 py-2")}>
                      <IconCheckCircle className="h-3.5 w-3.5" /> {m.teamA} Wins
                    </button>
                    <button type="button" onClick={() => setConfirm({ kind: "B" })} className={btnCls("red", "px-3 py-2")}>
                      <IconCheckCircle className="h-3.5 w-3.5" /> {m.teamB} Wins
                    </button>
                    <button type="button" onClick={() => setConfirm({ kind: "cancel" })} className={btnCls("purple", "px-3 py-2")}>
                      <IconXCircle className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </>
                )}

                <button type="button" onClick={() => setConfirm({ kind: "delete" })} className={btnCls("red", "px-3 py-2")}>
                  <IconTrash className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </>
          )}

          {feedback ? (
            <p className={`mt-2 text-[12px] font-semibold ${feedback.ok ? "text-brand" : "text-lay"}`}>
              {feedback.ok ? feedback.message : feedback.error}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function IconBarsSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" className="h-3.5 w-3.5">
      <path d="M5 19V12M12 19V5M19 19v-9" />
    </svg>
  );
}

function IconWarnSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </svg>
  );
}

/** Where the book stands on each side, and what it makes on each outcome. */
function PnlPanel({ m }: { m: MatchCardView }) {
  const sides = [
    { name: m.teamA, bets: m.betsA, stake: m.stakeA, house: m.houseIfA, payout: m.payoutA },
    { name: m.teamB, bets: m.betsB, stake: m.stakeB, house: m.houseIfB, payout: m.payoutB },
  ];

  return (
    <div className="animate-slide-down mt-4 border-t border-line pt-4">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
        <IconTrendUp className="h-3.5 w-3.5" /> Match P&amp;L breakdown
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {sides.map((s) => (
          <div
            key={`stake-${s.name}`}
            className={`rounded-xl border px-3.5 py-3 ${s.stake > 0 ? "border-lay/25 bg-lay/5" : "border-line bg-panel-2/60"}`}
          >
            <div className="truncate text-[11px] font-bold uppercase tracking-wider text-muted">{s.name}</div>
            <div className="font-display text-2xl font-extrabold text-ink">{s.bets}</div>
            <div className="text-[11px] text-muted">bets</div>
            <div className={`mt-1 text-[13px] font-bold ${s.stake > 0 ? "text-lay" : "text-muted"}`}>{coins(s.stake)} staked</div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        {sides.map((s) => (
          <div
            key={`house-${s.name}`}
            className={`rounded-xl border px-3.5 py-3 ${
              s.house >= 0 ? "border-emerald-500/25 bg-emerald-500/5" : "border-lay/25 bg-lay/5"
            }`}
          >
            <div className="truncate text-[11px] font-semibold text-muted">If {s.name} Wins</div>
            <div className={`font-display text-xl font-extrabold ${s.house >= 0 ? "text-emerald-600" : "text-lay"}`}>
              {signed(s.house)}
            </div>
            <div className="text-[11px] text-muted">house profit</div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
        <span className="rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 font-semibold text-ink/80">
          Total: {coins(m.totalStake)}
        </span>
        {sides.map((s) => (
          <span key={`payout-${s.name}`} className="rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 font-semibold text-ink/80">
            Payout {s.name}: {coins(s.payout)}
          </span>
        ))}
      </div>
    </div>
  );
}

const BET_TONE: Record<MatchCardView["bets"][number]["status"], string> = {
  open: "border-gold/35 bg-gold/10 text-gold",
  won: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  lost: "border-lay/30 bg-lay/10 text-lay",
  void: "border-purple/30 bg-purple/10 text-purple",
};

function BetsPanel({ m }: { m: MatchCardView }) {
  if (!m.bets.length) {
    return (
      <div className="animate-slide-down mt-4 rounded-xl border border-dashed border-line bg-panel-2/50 px-4 py-6 text-center text-[13px] text-muted">
        No bets placed on this match yet.
      </div>
    );
  }

  return (
    <div className="animate-slide-down mt-4 overflow-hidden rounded-xl border border-line">
      <table className="w-full text-[12px]">
        <thead className="bg-panel-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted">
          <tr>
            <th className="px-3 py-2">User</th>
            <th className="px-3 py-2">Pick</th>
            <th className="px-3 py-2 text-right">Stake</th>
            <th className="hidden px-3 py-2 text-right sm:table-cell">Rate</th>
            <th className="px-3 py-2 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {m.bets.map((b) => (
            <tr key={b.id} className="border-t border-line">
              <td className="px-3 py-2 font-semibold text-ink">{b.username}</td>
              <td className="px-3 py-2 text-muted">{b.selectionName}</td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-ink">{coins(b.stake)}</td>
              <td className="hidden px-3 py-2 text-right tabular-nums text-muted sm:table-cell">{b.rate.toFixed(2)}x</td>
              <td className="px-3 py-2 text-right">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${BET_TONE[b.status]}`}>
                  {b.status === "void" ? "refund" : b.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
