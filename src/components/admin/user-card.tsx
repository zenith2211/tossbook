"use client";

import { useState } from "react";
import { adjustBalanceAction } from "@/lib/actions/admin-actions";
import { useAction } from "./use-action";
import { Avatar, btnCls, fieldCls } from "./kit";
import { coins, fmtDateTime, signed } from "@/lib/format";
import { IconChevronDown, IconClock, IconEye, IconMinus, IconPlus, IconSliders } from "@/components/icons";

export interface UserBetView {
  id: number;
  matchTitle: string;
  selectionName: string;
  stake: number;
  rate: number;
  status: "open" | "won" | "lost" | "void";
  resultPl: number;
  placedAt: string;
}

export interface UserLedgerView {
  id: number;
  title: string;
  amount: number;
  balanceAfter: number;
  remark: string;
  at: string;
}

export interface UserCardView {
  id: number;
  username: string;
  name: string;
  publicId: string;
  balance: number;
  exposure: number;
  locked: boolean;
  bets: UserBetView[];
  ledger: UserLedgerView[];
}

type Mode = "add" | "deduct" | "set";
type Panel = "none" | Mode | "bets" | "wallet";

const MODE_COPY: Record<Mode, { title: string; verb: string; tone: "green" | "red" | "blue" }> = {
  add: { title: "Add to balance", verb: "Add", tone: "green" },
  deduct: { title: "Deduct from balance", verb: "Deduct", tone: "red" },
  set: { title: "Set exact balance", verb: "Set balance", tone: "blue" },
};

const QUICK = [500, 1000, 5000, 10000];

export function UserCard({ u }: { u: UserCardView }) {
  const [panel, setPanel] = useState<Panel>("none");
  const [amount, setAmount] = useState("");
  const adjust = useAction(adjustBalanceAction);

  function open(next: Panel) {
    adjust.clear();
    setAmount(next === "set" ? String(Math.round(u.balance)) : "");
    setPanel((p) => (p === next ? "none" : next));
  }

  const mode = panel === "add" || panel === "deduct" || panel === "set" ? panel : null;

  return (
    <article className="card-shadow rounded-2xl border border-line bg-panel p-3.5 sm:p-4">
      <div className="flex items-start gap-3">
        <Avatar name={u.username} />
        <div className="min-w-0 flex-1">
          <div className="font-display truncate text-[15px] font-extrabold text-ink">{u.username}</div>
          <div className="truncate text-[11px] text-muted">
            {u.name} · {u.publicId}…
          </div>
          {u.locked ? (
            <span className="mt-1 inline-block rounded-full border border-lay/35 bg-lay/10 px-2 py-0.5 text-[10px] font-bold text-lay">
              LOCKED
            </span>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Balance</div>
          <div className="font-display text-lg font-extrabold tabular-nums text-gold">{coins(u.balance)}</div>
          {u.exposure > 0 ? <div className="text-[11px] font-semibold text-lay">Exp {coins(u.exposure)}</div> : null}
        </div>
      </div>

      {/* Wallet + inspection controls. */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => open("add")} className={btnCls("green", "px-2.5 py-1.5")}>
          <IconPlus className="h-3.5 w-3.5" /> Add
        </button>
        <button type="button" onClick={() => open("deduct")} className={btnCls("red", "px-2.5 py-1.5")}>
          <IconMinus className="h-3.5 w-3.5" /> Deduct
        </button>
        <button type="button" onClick={() => open("set")} className={btnCls("blue", "px-2.5 py-1.5")}>
          <IconSliders className="h-3.5 w-3.5" /> Set
        </button>
        <button type="button" onClick={() => open("bets")} className={btnCls("neutral", "px-2.5 py-1.5")}>
          <IconEye className="h-3.5 w-3.5" /> Bets
          <IconChevronDown className={`h-3.5 w-3.5 transition ${panel === "bets" ? "rotate-180" : ""}`} />
        </button>
        <button type="button" onClick={() => open("wallet")} className={btnCls("neutral", "px-2.5 py-1.5")}>
          <IconClock className="h-3.5 w-3.5" /> Wallet Log
          <IconChevronDown className={`h-3.5 w-3.5 transition ${panel === "wallet" ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Amount entry for Add / Deduct / Set. */}
      {mode ? (
        <div className="animate-slide-down mt-3 rounded-xl border border-line bg-panel-2/60 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{MODE_COPY[mode].title}</div>
          <div className="mt-2 flex gap-2">
            <input
              autoFocus
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className={`${fieldCls} flex-1 bg-panel py-2.5 text-base font-bold`}
            />
            <button
              type="button"
              disabled={adjust.pending}
              onClick={() =>
                adjust.run({ userId: u.id, mode, amount: amount || "0" }, (r) => {
                  if (r.ok) {
                    setAmount("");
                    setPanel("none");
                  }
                })
              }
              className={btnCls(MODE_COPY[mode].tone, "px-3.5 py-2.5")}
            >
              {adjust.pending ? "Saving…" : MODE_COPY[mode].verb}
            </button>
          </div>
          {mode !== "set" ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String((Number(amount) || 0) + q))}
                  className="rounded-lg border border-line bg-panel px-2 py-1 text-[11px] font-semibold text-muted transition hover:text-ink"
                >
                  +{q.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {adjust.result ? (
        <p className={`mt-2 text-[12px] font-semibold ${adjust.result.ok ? "text-brand" : "text-lay"}`}>
          {adjust.result.ok ? adjust.result.message : adjust.result.error}
        </p>
      ) : null}

      {panel === "bets" ? <BetsTable bets={u.bets} /> : null}
      {panel === "wallet" ? <WalletTable rows={u.ledger} /> : null}
    </article>
  );
}

const BET_TONE: Record<UserBetView["status"], string> = {
  open: "border-gold/35 bg-gold/10 text-gold",
  won: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  lost: "border-lay/30 bg-lay/10 text-lay",
  void: "border-purple/30 bg-purple/10 text-purple",
};

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="animate-slide-down mt-3 overflow-x-auto rounded-xl border border-line">{children}</div>;
}

function PanelEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-slide-down mt-3 rounded-xl border border-dashed border-line bg-panel-2/50 px-4 py-6 text-center text-[12px] text-muted">
      {children}
    </div>
  );
}

function BetsTable({ bets }: { bets: UserBetView[] }) {
  if (!bets.length) return <PanelEmpty>This client hasn&apos;t placed any bets yet.</PanelEmpty>;
  return (
    <Shell>
      <table className="w-full min-w-[420px] text-[12px]">
        <thead className="bg-panel-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted">
          <tr>
            <th className="px-3 py-2">Match</th>
            <th className="px-3 py-2">Pick</th>
            <th className="px-3 py-2 text-right">Stake</th>
            <th className="px-3 py-2 text-right">Result</th>
          </tr>
        </thead>
        <tbody>
          {bets.map((b) => (
            <tr key={b.id} className="border-t border-line">
              <td className="px-3 py-2">
                <div className="font-semibold text-ink">{b.matchTitle}</div>
                <div className="text-[10px] text-muted">{fmtDateTime(b.placedAt)}</div>
              </td>
              <td className="px-3 py-2 text-muted">
                {b.selectionName}
                <span className="ml-1 text-[10px]">{b.rate.toFixed(2)}x</span>
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-ink">{coins(b.stake)}</td>
              <td className="px-3 py-2 text-right">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${BET_TONE[b.status]}`}>
                  {b.status === "void" ? "refund" : b.status}
                </span>
                {b.status === "won" || b.status === "lost" ? (
                  <div className={`text-[11px] font-bold tabular-nums ${b.resultPl >= 0 ? "text-emerald-600" : "text-lay"}`}>
                    {signed(b.resultPl)}
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}

function WalletTable({ rows }: { rows: UserLedgerView[] }) {
  if (!rows.length) return <PanelEmpty>No wallet movements on this account yet.</PanelEmpty>;
  return (
    <Shell>
      <table className="w-full min-w-[420px] text-[12px]">
        <thead className="bg-panel-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted">
          <tr>
            <th className="px-3 py-2">Entry</th>
            <th className="px-3 py-2 text-right">Amount</th>
            <th className="px-3 py-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-line">
              <td className="px-3 py-2">
                <div className="font-semibold capitalize text-ink">{r.title}</div>
                <div className="text-[10px] text-muted">
                  {fmtDateTime(r.at)}
                  {r.remark ? ` · ${r.remark}` : ""}
                </div>
              </td>
              <td className={`px-3 py-2 text-right font-bold tabular-nums ${r.amount >= 0 ? "text-emerald-600" : "text-lay"}`}>
                {signed(r.amount)}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-muted">{coins(r.balanceAfter)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
