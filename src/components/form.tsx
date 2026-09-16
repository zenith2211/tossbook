"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/action-result";

export function SubmitButton({
  children,
  className = "",
  variant = "brand",
  idleClass,
}: {
  children: ReactNode;
  className?: string;
  variant?: "brand" | "back" | "lay" | "ghost" | "danger";
  idleClass?: string;
}) {
  const { pending } = useFormStatus();
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition disabled:opacity-60";
  const variants: Record<string, string> = {
    brand: "bg-brand text-white hover:bg-brand-2 shadow-sm shadow-brand/30",
    back: "bg-back text-white hover:brightness-110",
    lay: "bg-lay text-white hover:brightness-110",
    danger: "bg-danger text-white hover:brightness-110",
    ghost: "border border-line bg-panel text-ink/80 hover:text-ink",
  };
  return (
    <button type="submit" disabled={pending} className={`${base} ${idleClass ?? variants[variant]} ${className}`}>
      {pending ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}

export function Banner({ state }: { state: ActionResult }) {
  if (state.error) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
        {state.error}
      </div>
    );
  }
  if (state.ok && state.message) {
    return (
      <div className="rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-sm font-medium text-brand">
        {state.message}
      </div>
    );
  }
  return null;
}

export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  onSuccess,
}: {
  action: (prev: ActionResult, fd: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  const ref = useRef<HTMLFormElement>(null);
  const seen = useRef(0);

  useEffect(() => {
    if (state.ok) {
      seen.current += 1;
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <Banner state={state} />
    </form>
  );
}

export function Modal({
  trigger,
  title,
  children,
  wide = false,
}: {
  trigger: (open: () => void) => ReactNode;
  title: string;
  children: (close: () => void) => ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {trigger(() => setOpen(true))}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className={`w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-md"} max-h-[92vh] overflow-y-auto rounded-t-2xl border border-line bg-panel p-4 shadow-2xl sm:rounded-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">{title}</h3>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {children(() => setOpen(false))}
          </div>
        </div>
      ) : null}
    </>
  );
}
