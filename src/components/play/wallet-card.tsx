"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { coins } from "@/lib/format";
import { IconMinus, IconPlus, IconRefresh } from "@/components/icons";

const ADMIN_TG = process.env.NEXT_PUBLIC_TELEGRAM_ADMIN || "RSTOSSBOOK01";
const TG_URL = `https://t.me/${ADMIN_TG}`;

export function WalletCard({
  balance,
  exposure,
  live,
}: {
  username: string;
  balance: number;
  exposure: number;
  live: boolean;
}) {
  return (
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

      {/* Both actions open the admin's Telegram chat directly — no amount step. */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <a
          href={TG_URL}
          target="_blank"
          rel="noreferrer"
          className="bg-grape glow-play inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
        >
          <IconPlus className="h-4 w-4" /> Deposit
        </a>
        <a
          href={TG_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-line bg-panel-2 px-4 py-3.5 text-sm font-bold text-ink/75 transition hover:border-brand/35 hover:text-brand"
        >
          <IconMinus className="h-4 w-4" /> Withdraw
        </a>
      </div>
    </section>
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
