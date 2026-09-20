"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { IconInfo, IconX } from "@/components/icons";

type ToastKind = "info" | "debit" | "credit" | "error";

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
}

interface ToastApi {
  /** Dark pill along the top — confirmations and errors. */
  notify: (title: string, detail?: string, kind?: ToastKind) => void;
  /** Red/green money chip in the bottom corner. */
  money: (amount: number, label?: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  // A no-op fallback keeps components usable outside the provider (e.g. tests).
  return ctx ?? { notify: () => {}, money: () => {} };
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const drop = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (toast: Omit<Toast, "id">, ms: number) => {
      const id = nextId++;
      setToasts((t) => [...t, { ...toast, id }]);
      setTimeout(() => drop(id), ms);
    },
    [drop],
  );

  const api: ToastApi = {
    notify: useCallback(
      (title, detail, kind: ToastKind = "info") => push({ kind, title, detail }, 4000),
      [push],
    ),
    money: useCallback(
      (amount: number, label?: string) =>
        push(
          {
            kind: amount < 0 ? "debit" : "credit",
            title: label ?? (amount < 0 ? "Balance Deducted" : "Balance Credited"),
            detail: `${amount < 0 ? "−" : "+"}₹${Math.abs(amount).toLocaleString("en-IN")}`,
          },
          3200,
        ),
      [push],
    ),
  };

  const banners = toasts.filter((t) => t.kind === "info" || t.kind === "error");
  const chips = toasts.filter((t) => t.kind === "debit" || t.kind === "credit");

  return (
    <Ctx.Provider value={api}>
      {children}

      {/* Top banner stack */}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3">
        {banners.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-[#171e2b] px-3.5 py-3 text-white shadow-2xl shadow-black/30"
          >
            <span
              className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                t.kind === "error" ? "bg-lay/20 text-lay" : "bg-purple/25 text-purple"
              }`}
            >
              <IconInfo className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold leading-tight">{t.title}</span>
              {t.detail ? <span className="block text-[12px] text-white/60">{t.detail}</span> : null}
            </span>
            <button
              onClick={() => drop(t.id)}
              aria-label="Dismiss"
              className="shrink-0 text-white/50 transition hover:text-white"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Money chip, bottom-right above the nav bar */}
      <div className="pointer-events-none fixed bottom-24 right-3 z-[60] flex flex-col items-end gap-2">
        {chips.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-toast-in rounded-2xl px-4 py-3 text-center shadow-2xl shadow-black/30 ${
              t.kind === "debit" ? "bg-[#7f1d24] text-white" : "bg-[#0f5132] text-white"
            }`}
          >
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-white/75">
              <Arrow up={t.kind === "credit"} /> {t.title}
            </span>
            <span className="font-display mt-0.5 block text-lg font-extrabold tabular-nums">{t.detail}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

function Arrow({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      {up ? <path d="M5 17 12 10l3 3 5-5M15 5h5v5" /> : <path d="M5 7l7 7 3-3 5 5M15 19h5v-5" />}
    </svg>
  );
}
