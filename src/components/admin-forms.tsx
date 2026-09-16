"use client";

import { useState } from "react";
import {
  createUserAction,
  transferAction,
  updateSettingsAction,
  resetPasswordAction,
} from "@/lib/actions/admin-actions";
import { ActionForm, Modal, SubmitButton } from "./form";
import { Field, inputCls, labelCls } from "./ui";
import { IconPlus, IconCash } from "./icons";

export function CreateAccountButton({ childRoleLabel }: { childRoleLabel: string }) {
  return (
    <Modal
      title={`Create ${childRoleLabel}`}
      trigger={(open) => (
        <button
          onClick={open}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-bold text-white transition hover:bg-brand-2"
        >
          <IconPlus className="h-4 w-4" /> New {childRoleLabel}
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={createUserAction} resetOnSuccess onSuccess={() => setTimeout(close, 700)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Username">
              <input name="username" autoCapitalize="none" spellCheck={false} className={inputCls} placeholder="john123" />
            </Field>
            <Field label="Display name">
              <input name="name" className={inputCls} placeholder="John" />
            </Field>
          </div>
          <Field label="Password" hint="Min 6 characters.">
            <input name="password" type="text" className={inputCls} placeholder="Set a login password" />
          </Field>
          <Field label="Opening balance (₹)" hint="Moved from your balance.">
            <input name="openingBalance" inputMode="numeric" defaultValue="0" className={inputCls} />
          </Field>
          <SubmitButton className="w-full">Add client</SubmitButton>
        </ActionForm>
      )}
    </Modal>
  );
}

export function TransferButton({
  childId,
  childUsername,
  compact = false,
}: {
  childId: number;
  childUsername: string;
  compact?: boolean;
}) {
  return (
    <Modal
      title={`Deposit / Withdraw · @${childUsername}`}
      trigger={(open) =>
        compact ? (
          <button
            onClick={open}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-brand hover:bg-brand/10"
            aria-label="Deposit / withdraw"
          >
            <IconCash className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={open}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-sm font-semibold text-ink/80 hover:text-ink"
          >
            <IconCash className="h-4 w-4" /> Deposit / Withdraw
          </button>
        )
      }
    >
      {(close) => <TransferFormBody childId={childId} onDone={() => setTimeout(close, 700)} />}
    </Modal>
  );
}

function TransferFormBody({ childId, onDone }: { childId: number; onDone: () => void }) {
  const [dir, setDir] = useState<"deposit" | "withdraw">("deposit");
  return (
    <ActionForm action={transferAction} resetOnSuccess onSuccess={onDone} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      <input type="hidden" name="direction" value={dir} />
      <div>
        <span className={labelCls}>Direction</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDir("deposit")}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              dir === "deposit" ? "border-brand bg-brand/15 text-brand" : "border-line text-muted"
            }`}
          >
            ⬇ Deposit (give)
          </button>
          <button
            type="button"
            onClick={() => setDir("withdraw")}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              dir === "withdraw" ? "border-lay bg-lay/15 text-lay" : "border-line text-muted"
            }`}
          >
            ⬆ Withdraw (take)
          </button>
        </div>
      </div>
      <Field label="Amount">
        <input name="amount" inputMode="numeric" className={inputCls} placeholder="0" />
      </Field>
      <Field label="Remark (optional)">
        <input name="remark" className={inputCls} placeholder="e.g. weekly settlement" />
      </Field>
      <SubmitButton className="w-full" variant={dir === "deposit" ? "brand" : "lay"}>
        {dir === "deposit" ? "Deposit" : "Withdraw"}
      </SubmitButton>
    </ActionForm>
  );
}

export function EditSettingsForm({
  childId,
  defaults,
}: {
  childId: number;
  defaults: { name: string };
}) {
  return (
    <ActionForm action={updateSettingsAction} className="space-y-3 p-4">
      <input type="hidden" name="childId" value={childId} />
      <Field label="Display name">
        <input name="name" defaultValue={defaults.name} className={inputCls} />
      </Field>
      <SubmitButton variant="ghost">Save name</SubmitButton>
    </ActionForm>
  );
}

export function ResetPasswordForm({ childId }: { childId: number }) {
  return (
    <ActionForm action={resetPasswordAction} resetOnSuccess className="flex items-end gap-2 p-4">
      <input type="hidden" name="childId" value={childId} />
      <div className="flex-1">
        <Field label="Reset password">
          <input name="password" type="text" className={inputCls} placeholder="New password" />
        </Field>
      </div>
      <SubmitButton variant="ghost">Reset</SubmitButton>
    </ActionForm>
  );
}
