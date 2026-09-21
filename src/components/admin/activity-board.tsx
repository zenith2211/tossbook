"use client";

import { useMemo, useState } from "react";
import { coins, parseStamp, relTime, signed } from "@/lib/format";
import type { BetEventKind } from "@/lib/domain";
import { EmptyState, StatTile } from "./kit";
import {
  IconActivity,
  IconCheckCircle,
  IconClock,
  IconPlus,
  IconSearch,
  IconX,
  IconXCircle,
} from "@/components/icons";

export interface ActivityEvent {
  key: string;
  kind: BetEventKind;
  username: string;
  matchTitle: string;
  selectionName: string;
  stake: number;
  rate: number;
  resultPl: number;
  at: string;
}

type Filter = "all" | "placed" | "cancelled" | "settled";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "placed", label: "Placed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "settled", label: "Settled" },
];

const META: Record<BetEventKind, { title: string; chip: string; icon: React.ReactNode }> = {
  placed: {
    title: "Bet Placed",
    chip: "border-gold/30 bg-gold/10 text-gold",
    icon: <IconPlus className="h-4 w-4" />,
  },
  cancelled: {
    title: "Bet Cancelled",
    chip: "border-lay/30 bg-lay/10 text-lay",
    icon: <IconXCircle className="h-4 w-4" />,
  },
  refunded: {
    title: "Bet Refunded",
    chip: "border-purple/30 bg-purple/10 text-purple",
    icon: <IconXCircle className="h-4 w-4" />,
  },
  won: {
    title: "Bet Won",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    icon: <IconCheckCircle className="h-4 w-4" />,
  },
  lost: {
    title: "Bet Lost",
    chip: "border-lay/30 bg-lay/10 text-lay",
    icon: <IconXCircle className="h-4 w-4" />,
  },
};

function inFilter(kind: BetEventKind, f: Filter): boolean {
  if (f === "all") return true;
  if (f === "placed") return kind === "placed";
  if (f === "cancelled") return kind === "cancelled";
  return kind === "won" || kind === "lost" || kind === "refunded";
}

function dayLabel(iso: string): string {
  const d = parseStamp(iso);
  const today = new Date();
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, new Date(today.getTime() - 86_400_000))) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function clockStamp(iso: string): string {
  return parseStamp(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function ActivityBoard({ events }: { events: ActivityEvent[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    let placed = 0,
      cancelled = 0,
      settled = 0;
    for (const e of events) {
      if (e.kind === "placed") placed++;
      else if (e.kind === "cancelled") cancelled++;
      else settled++;
    }
    return { placed, cancelled, settled };
  }, [events]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (!inFilter(e.kind, filter)) return false;
      if (q && ![e.username, e.matchTitle, e.selectionName].some((s) => s.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [events, filter, query]);

  const groups = useMemo(() => {
    const out: { label: string; rows: ActivityEvent[] }[] = [];
    for (const e of visible) {
      const label = dayLabel(e.at);
      const last = out[out.length - 1];
      if (last && last.label === label) last.rows.push(e);
      else out.push({ label, rows: [e] });
    }
    return out;
  }, [visible]);

  return (
    <div className="space-y-4">
      <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="text-brand">
            <IconActivity className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink">Activity</h2>
            <p className="text-[12px] text-muted">When clients place and cancel their bets.</p>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          <StatTile label="Placed" value={counts.placed} tone="gold" />
          <StatTile label="Cancelled" value={counts.cancelled} tone="lay" />
          <StatTile label="Settled" value={counts.settled} tone="brand" />
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
                {f.label}
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
              aria-label="Search activity"
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
          icon={<IconActivity className="h-8 w-8" />}
          title={events.length === 0 ? "No activity yet" : "Nothing matches those filters"}
          hint={
            events.length === 0
              ? "As soon as a client places or cancels a bet, it shows up here with the time."
              : "Try another type or clear the search."
          }
        />
      ) : (
        groups.map((g) => (
          <section key={g.label} className="space-y-2.5">
            <h3 className="px-1 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{g.label}</h3>
            {g.rows.map((e) => {
              const meta = META[e.kind];
              return (
                <article
                  key={e.key}
                  className="card-shadow flex items-start gap-3 rounded-2xl border border-line bg-panel p-3.5"
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${meta.chip}`}>
                    {meta.icon}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[14px] font-bold text-ink">{meta.title}</span>
                      <span className="text-[13px] font-semibold text-brand">@{e.username}</span>
                    </div>
                    <div className="truncate text-[12px] text-muted">
                      {e.matchTitle} · {e.selectionName} · {e.rate.toFixed(2)}x
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                      <IconClock className="h-3 w-3" />
                      {clockStamp(e.at)} · {relTime(e.at)}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="font-display text-[15px] font-extrabold tabular-nums text-ink">{coins(e.stake)}</div>
                    {e.kind === "won" || e.kind === "lost" ? (
                      <div className={`text-[12px] font-bold tabular-nums ${e.resultPl >= 0 ? "text-emerald-600" : "text-lay"}`}>
                        {signed(e.resultPl)}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}
