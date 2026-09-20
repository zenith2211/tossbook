"use client";

import { useMemo, useState } from "react";
import { deleteMatchesAction } from "@/lib/actions/admin-actions";
import { useAction } from "./use-action";
import { MatchCardAdmin } from "./match-card-admin";
import { CreateMatchPanel } from "./match-forms";
import { DbSetupModal, type DbInfo } from "./db-setup";
import { btnCls, EmptyState } from "./kit";
import { PHASE_ORDER, PHASE_TONE, type MatchCardView } from "./match-view";
import { IconCalendar, IconDot, IconPlus, IconSearch, IconTrash, IconTrophy, IconX } from "@/components/icons";
import type { MatchPhase } from "@/lib/types";

type Filter = "all" | MatchPhase;

export function MatchesBoard({ matches, db }: { matches: MatchCardView[]; db: DbInfo }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [day, setDay] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  const remove = useAction(deleteMatchesAction);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: matches.length, pending: 0, upcoming: 0, live: 0, closed: 0, cancelled: 0 };
    for (const m of matches) c[m.phase] += 1;
    return c;
  }, [matches]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matches.filter((m) => {
      if (filter !== "all" && m.phase !== filter) return false;
      if (q && ![m.title, m.teamA, m.teamB, m.league].some((s) => s.toLowerCase().includes(q))) return false;
      if (day) {
        const d = new Date(m.startTime);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (iso !== day) return false;
      }
      return true;
    });
  }, [matches, filter, query, day]);

  const visibleIds = visible.map((m) => m.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const filtering = filter !== "all" || query.trim() !== "" || day !== "";

  function selectOne(id: number, on: boolean) {
    setSelected((s) => (on ? [...new Set([...s, id])] : s.filter((x) => x !== id)));
  }

  function selectAll(on: boolean) {
    setSelected(on ? [...new Set([...selected, ...visibleIds])] : selected.filter((id) => !visibleIds.includes(id)));
  }

  return (
    <div className="space-y-4">
      <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="text-gold">
            <IconTrophy className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl font-extrabold text-ink">Matches</h2>
        </div>

        {/* Phase filters with live counts. */}
        <div className="mt-3.5 flex flex-wrap gap-2">
          {(["all", ...PHASE_ORDER] as Filter[]).map((f) => {
            const on = filter === f;
            const label = f === "all" ? "All" : PHASE_TONE[f].label.charAt(0) + PHASE_TONE[f].label.slice(1).toLowerCase();
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
                  on ? "bg-[#1e2b3d] text-white shadow-sm" : "border border-line bg-panel text-muted hover:text-ink"
                }`}
              >
                {f !== "all" ? <IconDot className={`h-1.5 w-1.5 ${on ? "text-white/70" : PHASE_TONE[f].dot}`} /> : null}
                {label} ({counts[f]})
              </button>
            );
          })}
        </div>

        {/* Search, date filter and the primary actions. */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
          <label className="relative min-w-[210px] flex-1">
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team or title…"
              aria-label="Search matches"
              className="w-full rounded-xl border border-transparent bg-panel-2 py-2.5 pl-10 pr-3 text-sm font-medium text-ink outline-none inset-soft placeholder:font-normal placeholder:text-muted/80 focus:border-brand/40 focus:bg-panel focus:ring-4 focus:ring-brand/10"
            />
          </label>

          <div className="ml-auto flex flex-wrap gap-2">
            {selected.length ? (
              <button
                type="button"
                disabled={remove.pending}
                onClick={() => remove.run({ matchIds: selected.join(",") }, (r) => r.ok && setSelected([]))}
                className={btnCls("red", "px-3.5")}
              >
                <IconTrash className="h-4 w-4" />
                {remove.pending ? "Deleting…" : `Delete ${selected.length} Selected`}
              </button>
            ) : null}
            <DbSetupModal info={db} />
            <button type="button" onClick={() => setCreating((c) => !c)} className={btnCls("primary", "px-4")}>
              <IconPlus className="h-4 w-4" /> New Match
            </button>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
          <label className="relative">
            <IconCalendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              aria-label="Filter by match date"
              className="rounded-xl border border-transparent bg-panel-2 py-2.5 pl-9 pr-3 text-sm font-medium text-ink outline-none inset-soft focus:border-brand/40 focus:bg-panel focus:ring-4 focus:ring-brand/10"
            />
          </label>
          {filtering ? (
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setQuery("");
                setDay("");
              }}
              className={btnCls("ghost", "px-2 py-1.5")}
            >
              <IconX className="h-3.5 w-3.5" /> Clear filters
            </button>
          ) : null}
        </div>

        {/* Bulk selection. */}
        {visible.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
            <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink/75">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => selectAll(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              Select all ({visible.length})
            </label>
            {selected.length ? <span className="text-[12px] text-muted">{selected.length} selected</span> : null}
          </div>
        ) : null}

        {remove.result ? (
          <p className={`mt-2 text-[12px] font-semibold ${remove.result.ok ? "text-brand" : "text-lay"}`}>
            {remove.result.ok ? remove.result.message : remove.result.error}
          </p>
        ) : null}
      </section>

      {creating ? <CreateMatchPanel onClose={() => setCreating(false)} /> : null}

      {/* The list. */}
      {visible.length === 0 ? (
        <EmptyState
          icon={<IconTrophy className="h-8 w-8" />}
          title={matches.length === 0 ? "No matches yet" : "Nothing matches those filters"}
          hint={
            matches.length === 0
              ? "Create your first match to open the toss market for your clients."
              : "Try a different status, clear the search, or pick another date."
          }
          action={
            matches.length === 0 ? (
              <button type="button" onClick={() => setCreating(true)} className={btnCls("primary", "px-4")}>
                <IconPlus className="h-4 w-4" /> New Match
              </button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3.5">
          {visible.map((m) => (
            <MatchCardAdmin key={m.id} m={m} selected={selected.includes(m.id)} onSelect={selectOne} />
          ))}
        </div>
      )}
    </div>
  );
}
