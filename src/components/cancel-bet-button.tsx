"use client";

import { useState, useTransition } from "react";
import { cancelBetAction } from "@/lib/actions/bet-actions";

export function CancelBetButton({ betId }: { betId: number }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function doCancel() {
    setErr(null);
    start(async () => {
      const r = await cancelBetAction(betId);
      if (!r.ok) setErr(r.error ?? "Could not cancel bet.");
      else setConfirming(false);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={doCancel}
            className="rounded-md border border-danger/40 bg-danger/10 px-2.5 py-1 text-xs font-bold text-danger transition hover:bg-danger/20 disabled:opacity-50"
          >
            {pending ? "Cancelling…" : "Yes, cancel"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(false)}
            className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-muted transition hover:text-ink"
          >
            No
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-danger/40 hover:text-danger"
        >
          Cancel bet
        </button>
      )}
      {err ? <span className="text-[11px] text-danger">{err}</span> : null}
    </div>
  );
}
