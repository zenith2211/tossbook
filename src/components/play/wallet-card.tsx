"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestFundsAction } from "@/lib/actions/fund-actions";
import { coins } from "@/lib/format";
import { useToast } from "./toast";
import { IconMinus, IconPlus, IconRefresh, IconX } from "@/components/icons";

const ADMIN_TG = process.env.NEXT_PUBLIC_TELEGRAM_ADMIN || "RSTOSSBOOK01";
const QUICK = [500, 1000, 5000, 10000];

export function WalletCard({
  username,
  balance,
  exposure,
  live,
}: {
  username: string;
  balance: number;
  exposure: number;
  live: boolean;
}) {
  const [sheet, setSheet] = useState<null | "deposit" | "withdraw">(null);

  return (
    <>
      <section className="card-shadow rounded-2xl border border-line bg-panel p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Total balance</div>
            <div className="font-display text-3xl font-extrabold tabular-nums text-ink">{coins(balance)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-gold">Exposure</div>
            <div className={`font-display text-2xl font-extrabold tabular-nums ${exposure > 0 ? "text-lay" : "text-ink"}`}>
              {coins(exposure)}
            </div>
            {live ? (
              <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setSheet("deposit")}
            className="bg-grape glow-play inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            <IconPlus className="h-4 w-4" /> Deposit
          </button>
          <button
            type="button"
            onClick={() => setSheet("withdraw")}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-line bg-panel-2 px-4 py-3.5 text-sm font-bold text-ink/75 transition hover:border-brand/35 hover:text-brand"
          >
            <IconMinus className="h-4 w-4" /> Withdraw
          </button>
        </div>
      </section>

      {sheet ? (
        <FundSheet type={sheet} username={username} available={balance} onClose={() => setSheet(null)} />
      ) : null}
    </>
  );
}

function FundSheet({
  type,
  username,
  available,
  onClose,
}: {
  type: "deposit" | "withdraw";
  username: string;
  available: number;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const isWithdraw = type === "withdraw";
  const amt = Number(amount) || 0;

  function submit() {
    if (!(amt > 0)) return setError("Enter a valid amount.");
    if (isWithdraw && amt > available) return setError("That is more than your available balance.");
    setError("");

    start(async () => {
      const r = await requestFundsAction(type, amt);
      if (!r.ok) return setError(r.error ?? "Request failed.");

      const label = isWithdraw ? "Withdrawal" : "Refill / Deposit";
      if (r.message !== "auto") {
        const text = `${label} request\nUser: @${username}\nAmount: ₹${amt.toLocaleString("en-IN")}`;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          /* clipboard may be unavailable; the chat still opens */
        }
        window.open(`https://t.me/${ADMIN_TG}`, "_blank");
      }
      toast.notify(
        `${label} request sent`,
        r.message === "auto" ? "The admin has it on Telegram." : `Opened @${ADMIN_TG} — request copied, just paste & send.`,
      );
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-pop-in card-shadow w-full max-w-md rounded-t-3xl border border-line bg-panel p-4 sm:rounded-3xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              {isWithdraw ? "Cash out" : "Top up"}
            </p>
            <h2 className="font-display text-xl font-extrabold text-ink">{isWithdraw ? "Withdraw" : "Deposit"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel-2 text-muted transition hover:text-ink"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1 text-[12px] text-muted">
          {isWithdraw
            ? "The admin reviews your request on Telegram and pays out."
            : "The admin reviews your request on Telegram and tops up your balance."}
        </p>

        <div className="relative mt-4">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-muted">₹</span>
          <input
            autoFocus
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^0-9]/g, ""));
              setError("");
            }}
            placeholder="0"
            aria-label="Amount"
            className="w-full rounded-2xl border-2 border-line bg-panel-2 py-3.5 pl-9 pr-4 text-lg font-bold text-ink outline-none transition placeholder:text-muted/70 focus:border-brand/50 focus:bg-panel focus:ring-4 focus:ring-brand/10"
          />
        </div>

        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String((Number(amount) || 0) + q))}
              className="rounded-xl border border-line bg-panel-2 py-2 text-[12px] font-bold text-ink/75 transition hover:border-brand/40 hover:text-brand"
            >
              +{q >= 1000 ? `${q / 1000}k` : q}
            </button>
          ))}
        </div>

        {isWithdraw ? (
          <button
            type="button"
            onClick={() => setAmount(String(Math.floor(available)))}
            className="mt-2 w-full rounded-xl border border-brand/35 bg-brand/5 py-2 text-[12px] font-bold text-brand transition hover:bg-brand/10"
          >
            Withdraw everything — {coins(available)}
          </button>
        ) : null}

        {error ? <p className="mt-3 text-[13px] font-semibold text-lay">{error}</p> : null}

        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className={`mt-4 w-full rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition disabled:opacity-60 ${
            isWithdraw ? "bg-lay hover:brightness-110" : "bg-grape glow-play hover:brightness-110"
          }`}
        >
          {pending ? "Sending…" : isWithdraw ? "Send withdrawal request" : "Send deposit request"}
        </button>
      </div>
    </div>
  );
}

/** Pulls fresh match data without a full page reload. */
export function RefreshButton() {
  const router = useRouter();
  const [spinning, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(() => router.refresh())}
      aria-label="Refresh matches"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-panel text-muted transition hover:border-brand/40 hover:text-brand"
    >
      <IconRefresh className={`h-[18px] w-[18px] ${spinning ? "animate-spin" : ""}`} />
    </button>
  );
}
