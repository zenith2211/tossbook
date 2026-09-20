"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";

type ServerAction = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

/**
 * Calls a server action from an ordinary button, keeping the pending flag and
 * the result together. Use this for the compact controls on cards where a
 * full `<form>` with its own banner would be too heavy.
 */
export function useAction(fn: ServerAction) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function run(fields: Record<string, string | number>, onDone?: (r: ActionResult) => void) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, String(v));
    start(async () => {
      const r = await fn({ ok: false }, fd);
      setResult(r);
      onDone?.(r);
    });
  }

  return { pending, result, run, clear: () => setResult(null) };
}
