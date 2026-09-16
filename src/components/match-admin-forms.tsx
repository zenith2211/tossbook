"use client";

import { useState } from "react";
import {
  createMatchAction,
  updateMarketAction,
  settleMarketAction,
} from "@/lib/actions/admin-actions";
import { ActionForm, Modal, SubmitButton } from "./form";
import { Field, inputCls, labelCls } from "./ui";
import { IconPlus } from "./icons";

export function CreateMatchButton() {
  return (
    <Modal
      title="Create match"
      trigger={(open) => (
        <button
          onClick={open}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-bold text-white transition hover:bg-brand-2"
        >
          <IconPlus className="h-4 w-4" /> New Match
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={createMatchAction} resetOnSuccess onSuccess={() => setTimeout(close, 700)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Team A">
              <input name="teamA" className={inputCls} placeholder="India" />
            </Field>
            <Field label="Team B">
              <input name="teamB" className={inputCls} placeholder="Australia" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Odds — Team A" hint="e.g. 1.95 → returns 1.95×">
              <input name="rateA" inputMode="decimal" defaultValue="1.95" className={inputCls} />
            </Field>
            <Field label="Odds — Team B" hint="e.g. 2.50 → returns 2.50×">
              <input name="rateB" inputMode="decimal" defaultValue="1.95" className={inputCls} />
            </Field>
          </div>
          <Field label="League / Series">
            <input name="league" className={inputCls} placeholder="T20 International" defaultValue="Cricket" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time">
              <input name="startTime" type="datetime-local" className={inputCls} />
            </Field>
            <Field label="Betting closes at" hint="After this, betting is locked.">
              <input name="endTime" type="datetime-local" className={inputCls} />
            </Field>
          </div>
          <p className="text-xs text-muted">
            Odds apply to the Toss &amp; Match markets. You can fine-tune them per market afterwards.
          </p>
          <SubmitButton className="w-full">Create match</SubmitButton>
        </ActionForm>
      )}
    </Modal>
  );
}

export function MarketEditForm({
  market,
}: {
  market: {
    id: number;
    name: string;
    status: string;
    rate_a: number;
    rate_b: number;
    min_stake: number;
    max_stake: number;
  };
}) {
  return (
    <ActionForm action={updateMarketAction} className="space-y-3">
      <input type="hidden" name="marketId" value={market.id} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rate — Team A">
          <input name="rateA" inputMode="decimal" defaultValue={market.rate_a} className={inputCls} />
        </Field>
        <Field label="Rate — Team B">
          <input name="rateB" inputMode="decimal" defaultValue={market.rate_b} className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <span className={labelCls}>Status</span>
          <select name="status" defaultValue={market.status} className={inputCls}>
            <option value="open">Open</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <Field label="Min stake">
          <input name="minStake" inputMode="numeric" defaultValue={market.min_stake} className={inputCls} />
        </Field>
        <Field label="Max stake">
          <input name="maxStake" inputMode="numeric" defaultValue={market.max_stake} className={inputCls} />
        </Field>
      </div>
      <SubmitButton variant="ghost">Update market</SubmitButton>
    </ActionForm>
  );
}

export function DeclareResultForm({
  marketId,
  teamA,
  teamB,
}: {
  marketId: number;
  teamA: string;
  teamB: string;
}) {
  const [result, setResult] = useState<"A" | "B" | "void" | "">("");
  const options: { v: "A" | "B" | "void"; label: string; cls: string }[] = [
    { v: "A", label: teamA, cls: "border-brand bg-brand/15 text-brand" },
    { v: "B", label: teamB, cls: "border-brand bg-brand/15 text-brand" },
    { v: "void", label: "Void / No result", cls: "border-muted bg-panel-2 text-ink" },
  ];
  return (
    <ActionForm action={settleMarketAction} className="space-y-3">
      <input type="hidden" name="marketId" value={marketId} />
      <input type="hidden" name="result" value={result} />
      <span className={labelCls}>Declare winner</span>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setResult(o.v)}
            className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
              result === o.v ? o.cls : "border-line text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {result ? (
        <SubmitButton className="w-full" variant="danger">
          Settle &amp; pay out — {result === "A" ? teamA : result === "B" ? teamB : "Void"}
        </SubmitButton>
      ) : (
        <p className="text-xs text-muted">Select an outcome to settle all open bets on this market.</p>
      )}
    </ActionForm>
  );
}
