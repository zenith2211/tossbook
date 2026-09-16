"use client";

import { changePasswordAction } from "@/lib/actions/auth-actions";
import { ActionForm, SubmitButton } from "./form";
import { Field, inputCls } from "./ui";

export function ChangePasswordForm() {
  return (
    <ActionForm action={changePasswordAction} resetOnSuccess className="space-y-3 p-4">
      <Field label="Current password">
        <input name="current" type="password" autoComplete="current-password" className={inputCls} />
      </Field>
      <Field label="New password" hint="At least 6 characters.">
        <input name="next" type="password" autoComplete="new-password" className={inputCls} />
      </Field>
      <Field label="Confirm new password">
        <input name="confirm" type="password" autoComplete="new-password" className={inputCls} />
      </Field>
      <SubmitButton>Update password</SubmitButton>
    </ActionForm>
  );
}
