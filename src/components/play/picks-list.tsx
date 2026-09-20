"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { coins, fmtTime, parseStamp, round2 } from "@/lib/format";
import { CancelPickButton } from "./cancel-pick";
import { EmptyState } from "@/components/admin/kit";
import {
  IconArrowDownRight,
  IconClock,
  IconSearch,
  IconTarget,
  IconTicket,
  IconTrophy,
  IconWallet,
  IconXCircle,
} from "@/components/icons";

export interface PickRow {
  id: number;
  matchTitle: string;
  league: string;
  selectionName: string;
  stake: number;
  rate: number;
  status: "open" | "won" | "lost" | "void";
  voidReason: string | null;
  resultPl: number;
  placedAt: string;
  /** Close time of the match — after this a pick can no longer be cancelled. */
  matchEndTime: string | null;
}

type Filter = "all" | "live" | "won" | "lost" | "cancelled";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
  { key: "cancelled", label: "Cancelled" },
];

function bucket(p: PickRow): Filter {
  if (p.status === "open") return "live";
  if (p.status === "won") return "won";
  if (p.status === "lost") return "lost";
  return "cancelled";
}

const STATUS_CHIP: Record<Filter, string> = {
  all: "",
  live: "border-gold/40 bg-gold/10 text-gold",
  won: "border-emerald-500/35 bg-emerald-500/10 text-emerald-600",
  lost: "border-lay/35 bg-lay/10 text-lay",
  cancelled: "border-purple/35 bg-purple/10 text-purple",
};

/** "Today" / "Yesterday" / "12 Sept 2026" for the group headings. */
function dayLabel(iso: string): string {
  const d = parseStamp(iso);
  const today = new Date();
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  const yest = new Date(today.getTime() - 86_400_000);
  if (same(d, yest)) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function PicksList({ picks }: { picks: PickRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(
    () => ({
      live: picks.filter((p) => p.status === "open").length,
      won: picks.filter((p) => p.status === "won").length,
      lost: picks.filter((p) => p.status === "lost").length,
      invested: picks.filter((p) => p.status === "open").reduce((s, p) => s + p.stake, 0),
    }),
    [picks],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return picks.filter((p) => {
      if (filter !== "all" && bucket(p) !== filter) return false;
      if (q && ![p.matchTitle, p.league, p.selectionName].some((s) => s.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [picks, filter, query]);

  // Group by calendar day, newest first (the list already arrives sorted).
  const groups = useMemo(() => {
    const out: { label: string; rows: PickRow[] }[] = [];
    for (const p of visible) {
      const label = dayLabel(p.placedAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.rows.push(p);
      else out.push({ label, rows: [p] });
    }
    return out;
  }, [visible]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <StatTile icon={<IconTarget className="h-5 w-5" />} value={stats.live} label="Live" tone="text-gold" />
        <StatTile icon={<IconTrophy className="h-5 w-5" />} value={stats.won} label="Won" tone="text-emerald-600" />
        <StatTile icon={<IconArrowDownRight className="h-5 w-5" />} value={stats.lost} label="Lost" tone="text-lay" />
        <StatTile icon={<IconWallet className="h-5 w-5" />} value={coins(stats.invested)} label="Invested" tone="text-back" />
      </div>

      <label className="relative block">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search league or teams…"
          aria-label="Search picks"
          className="w-full rounded-2xl border border-line bg-panel-2 py-3 pl-11 pr-4 text-sm font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-muted/80 focus:border-brand/40 focus:bg-panel focus:ring-4 focus:ring-brand/10"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={on}
              className={`rounded-full px-4 py-2 text-[13px] font-bold transition ${
                on ? "bg-back text-white shadow-sm" : "border border-line bg-panel-2 text-muted hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<IconTicket className="h-8 w-8" />}
          title={picks.length === 0 ? "No picks yet" : "Nothing matches those filters"}
          hint={
            picks.length === 0
              ? "Back a toss from the Matches tab and it shows up here."
              : "Try another status or clear the search box."
          }
        />
      ) : (
        groups.map((g) => (
          <section key={g.label} className="space-y-2.5">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{g.label}</h2>
            {g.rows.map((p) => (
              <PickCard key={p.id} pick={p} onCancelled={() => router.refresh()} />
            ))}
          </section>
        ))
      )}
    </div>
  );
}

function StatTile({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tone: string;
}) {
  return (
    <div className="card-shadow rounded-2xl border border-line bg-panel px-1.5 py-3 text-center">
      <span className={`mx-auto grid place-items-center ${tone}`}>{icon}</span>
      <div className={`font-display mt-1 truncate text-lg font-extrabold tabular-nums ${tone}`}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

function PickCard({ pick, onCancelled }: { pick: PickRow; onCancelled: () => void }) {
  const kind = bucket(pick);
  const closed = pick.matchEndTime != null && parseStamp(pick.matchEndTime).getTime() <= Date.now();
  const canCancel = pick.status === "open" && !closed;
  const label = kind === "live" ? "LIVE" : kind === "cancelled" ? (pick.voidReason ?? "cancelled").toUpperCase() : kind.toUpperCase();

  return (
    <article className="card-shadow rounded-2xl border border-line bg-panel p-3.5">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_CHIP[kind]}`}>
          <IconClock className="h-3 w-3" /> {label}
        </span>
        <span className="text-[12px] text-muted">{fmtTime(pick.placedAt)}</span>
        <span className="ml-auto font-display text-[15px] font-extrabold tabular-nums text-ink">
          {coins(pick.stake)}
        </span>
      </div>

      <p className="mt-2.5 text-[11px] font-bold uppercase tracking-wider text-muted">{pick.league}</p>
      <h3 className="font-display text-lg font-extrabold text-ink">{pick.matchTitle}</h3>
      <p className="text-[13px] text-muted">
        Pick: <b className="text-back">{pick.selectionName}</b> · Rate <b className="text-ink">{pick.rate.toFixed(2)}x</b>
      </p>

      <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-[13px]">
        {pick.status === "open" ? (
          <>
            <Line label="Profit if win" value={coins(round2(pick.stake * (pick.rate - 1)))} tone="text-back" />
            <Line label="Total return" value={coins(round2(pick.stake * pick.rate))} tone="text-ink" />
          </>
        ) : pick.status === "void" ? (
          <Line label="Stake refunded" value={coins(pick.stake)} tone="text-purple" />
        ) : (
          <Line
            label={pick.status === "won" ? "You won" : "You lost"}
            value={`${pick.resultPl >= 0 ? "+" : "−"}${coins(Math.abs(pick.resultPl))}`}
            tone={pick.resultPl >= 0 ? "text-emerald-600" : "text-lay"}
          />
        )}
      </div>

      {canCancel ? (
        <div className="mt-3">
          <CancelPickButton
            betId={pick.id}
            stake={pick.stake}
            onDone={onCancelled}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-lay/40 bg-lay/5 px-4 py-3 text-sm font-bold text-lay transition hover:bg-lay/10"
          >
            <IconXCircle className="h-4 w-4" /> Cancel Bet
          </CancelPickButton>
        </div>
      ) : null}
    </article>
  );
}

function Line({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={`font-bold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}
