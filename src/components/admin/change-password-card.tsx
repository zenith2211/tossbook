"use client";

import { changePasswordAction } from "@/lib/actions/auth-actions";
import { ActionForm, SubmitButton } from "@/components/form";
import { FormField, fieldCls, IconTile } from "./kit";
import { IconKey } from "@/components/icons";

export function ChangePasswordCard() {
  return (
    <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <IconTile tone="gold">
          <IconKey className="h-4 w-4" />
        </IconTile>
        <div>
          <h3 className="font-display text-base font-bold leading-tight text-ink">Change password</h3>
          <p className="text-[11px] text-muted">Use at least 6 characters.</p>
        </div>
      </div>

      <ActionForm action={changePasswordAction} resetOnSuccess className="mt-3.5 space-y-3">
        <FormField label="Current password">
          <input name="current" type="password" autoComplete="current-password" className={fieldCls} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="New password">
            <input name="next" type="password" autoComplete="new-password" className={fieldCls} />
          </FormField>
          <FormField label="Confirm new password">
            <input name="confirm" type="password" autoComplete="new-password" className={fieldCls} />
          </FormField>
        </div>
        <SubmitButton idleClass="bg-gradient-to-b from-brand to-brand-2 text-white shadow-sm shadow-brand/25 hover:brightness-110 px-4 w-full py-3">
          Update password
        </SubmitButton>
      </ActionForm>
    </section>
  );
}
