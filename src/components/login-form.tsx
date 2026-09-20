"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions/auth-actions";
import { Banner, SubmitButton } from "./form";
import { IconUser, IconLock, IconEye, IconEyeOff, IconShield } from "./icons";

const fieldWrap = "relative";
const iconLeft = "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted";
const withIcon =
  "w-full rounded-lg border border-line bg-panel-2 py-2.5 pl-10 pr-10 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:bg-panel focus:ring-2 focus:ring-brand/20";

export function LoginForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(loginAction, { ok: false });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (state.ok) {
      router.replace("/");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">Username</label>
          <div className={fieldWrap}>
            <span className={iconLeft}><IconUser className="h-4 w-4" /></span>
            <input
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Your username"
              className={withIcon}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">Password</label>
            <a href="#" className="text-[11px] font-semibold text-gold hover:underline">Forgot access?</a>
          </div>
          <div className={fieldWrap}>
            <span className={iconLeft}><IconLock className="h-4 w-4" /></span>
            <input
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              className={withIcon}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Banner state={state} />

        <SubmitButton className="w-full py-2.5">
          <IconShield className="h-4 w-4" /> Login to Account
        </SubmitButton>
      </form>
    </div>
  );
}
