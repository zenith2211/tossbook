"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { forceChangePasswordAction } from "@/lib/actions/auth-actions";
import { Banner, SubmitButton } from "./form";
import { Field, inputCls } from "./ui";

export function FirstLoginPasswordForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(forceChangePasswordAction, { ok: false });

  useEffect(() => {
    if (state.ok) {
      router.replace("/play");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-3">
      <Field label="New password" hint="At least 6 characters.">
        <input name="next" type="password" autoComplete="new-password" className={inputCls} />
      </Field>
      <Field label="Confirm new password">
        <input name="confirm" type="password" autoComplete="new-password" className={inputCls} />
      </Field>
      <Banner state={state} />
      <SubmitButton className="w-full py-2.5">Set new password</SubmitButton>
    </form>
  );
}
