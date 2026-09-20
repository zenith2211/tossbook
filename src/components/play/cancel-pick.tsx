"use client";

import { useState, useTransition, type ReactNode } from "react";
import { cancelBetAction } from "@/lib/actions/bet-actions";
import { useToast } from "./toast";

/**
 * Cancel control with an inline confirm. The caller supplies the trigger's
 * look so the same behaviour fits both the match card and the picks list.
 */
export function CancelPickButton({
  betId,
  stake,
  className,
  children,
  onDone,
}: {
  betId: number;
  stake?: number;
  className: string;
  children: ReactNode;
  onDone?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const toast = useToast();

  function run() {
    setError("");
    start(async () => {
      const r = await cancelBetAction(betId);
      if (!r.ok) {
        setError(r.error ?? "Could not cancel this pick.");
        return;
      }
      toast.notify("Pick cancelled", "Your stake has been returned.");
      if (stake) toast.money(stake, "Balance Credited");
      setConfirming(false);
      onDone?.();
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={run}
            className="flex-1 rounded-2xl border border-lay/40 bg-lay/10 px-3 py-3 text-[12px] font-bold text-lay transition hover:bg-lay/20 disabled:opacity-50"
          >
            {pending ? "Cancelling…" : "Yes, cancel"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(false)}
            className="flex-1 rounded-2xl border border-line bg-panel-2 px-3 py-3 text-[12px] font-bold text-muted transition hover:text-ink"
          >
            No
          </button>
        </div>
        {error ? <span className="text-[11px] font-semibold text-lay">{error}</span> : null}
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className={className}>
      {children}
    </button>
  );
}
