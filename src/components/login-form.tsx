"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions/auth-actions";
import { Banner, SubmitButton } from "./form";
import { IconUser, IconLock, IconEye, IconEyeOff, IconShield } from "./icons";

const field =
  "w-full rounded-xl border border-line bg-panel-2 py-3.5 pl-11 pr-11 text-sm font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-muted/70 focus:border-brand/50 focus:bg-panel focus:ring-4 focus:ring-brand/12";
const iconLeft = "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted";
const label = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-muted";

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
    <form action={formAction} className="space-y-4">
      <div>
        <label className={label}>Username</label>
        <div className="relative">
          <span className={iconLeft}>
            <IconUser className="h-4 w-4" />
          </span>
          <input
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Your username"
            className={field}
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className={`${label} mb-0`}>Password</span>
          <a href="#" className="text-[11px] font-semibold text-gold hover:underline">
            Forgot access?
          </a>
        </div>
        <div className="relative">
          <span className={iconLeft}>
            <IconLock className="h-4 w-4" />
          </span>
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            className={field}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition hover:text-ink"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Banner state={state} />

      <SubmitButton idleClass="bg-teal-cta text-white glow-brand sheen hover:brightness-110" className="w-full py-3.5 text-sm">
        <IconShield className="h-4 w-4" /> Login to Account
      </SubmitButton>
    </form>
  );
}
