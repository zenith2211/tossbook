"use client";

import { useState, useTransition } from "react";
import { Modal } from "./form";
import { labelCls } from "./ui";
import { requestFundsAction } from "@/lib/actions/fund-actions";
import { coins } from "@/lib/format";
import { IconCash } from "./icons";

const ADMIN_TG = process.env.NEXT_PUBLIC_TELEGRAM_ADMIN || "RSTOSSBOOK01";

function telegramShareUrl(text: string): string {
  // Opens Telegram with the message prefilled; the user picks the admin chat.
  return `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${ADMIN_TG}`)}&text=${encodeURIComponent(text)}`;
}

const QUICK = [500, 1000, 5000, 10000];

function FundForm({
  type,
  username,
  available,
  close,
}: {
  type: "deposit" | "withdraw";
  username: string;
  available: number;
  close: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const amt = Number(amount.replace(/[^0-9]/g, "")) || 0;
  const isWithdraw = type === "withdraw";

  function submit() {
    if (!(amt > 0)) return setMsg({ ok: false, text: "Enter a valid amount." });
    if (isWithdraw && amt > available) return setMsg({ ok: false, text: "Amount exceeds your available balance." });
    setMsg(null);
    start(async () => {
      const r = await requestFundsAction(type, amt);
      if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Request failed." });
      const label = isWithdraw ? "Withdrawal" : "Refill / Deposit";
      if (r.message !== "auto") {
        const text = `${label} request\nUser: @${username}\nAmount: ₹${amt.toLocaleString("en-IN")}`;
        window.open(telegramShareUrl(text), "_blank");
      }
      setMsg({
        ok: true,
        text: r.message === "auto" ? "Request sent to admin on Telegram ✓" : "Opening Telegram to send your request…",
      });
      setTimeout(close, 1600);
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        {isWithdraw
          ? "Request a withdrawal — the admin reviews it on Telegram and pays out."
          : "Request a refill — the admin reviews it on Telegram and tops up your balance."}
      </p>
      <div>
        <span className={labelCls}>Amount (₹)</span>
        <input
          inputMode="numeric"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="0"
          className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-lg font-bold text-ink outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount(String((Number(amount) || 0) + q))}
            className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink/70 hover:border-brand/40 hover:text-ink"
          >
            +{coins(q)}
          </button>
        ))}
        {isWithdraw ? (
          <button
            type="button"
            onClick={() => setAmount(String(Math.floor(available)))}
            className="rounded-md border border-brand/30 bg-brand/5 px-2.5 py-1 text-xs font-bold text-brand hover:bg-brand/10"
          >
            Max
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setAmount("")}
          className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-muted hover:text-ink"
        >
          Clear
        </button>
      </div>
      {isWithdraw ? (
        <p className="text-[11px] text-muted">Available to withdraw: <span className="font-semibold text-ink">{coins(available)}</span></p>
      ) : null}
      {msg ? (
        <p className={`text-sm font-medium ${msg.ok ? "text-brand" : "text-danger"}`}>{msg.text}</p>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-60 ${
          isWithdraw ? "bg-lay hover:brightness-110" : "bg-brand hover:bg-brand-2"
        }`}
      >
        {pending ? "Sending…" : isWithdraw ? "Send withdrawal request" : "Send deposit request"}
      </button>
    </div>
  );
}

export function FundRequest({ username, available }: { username: string; available: number }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Modal
        title="Deposit / Refill"
        trigger={(open) => (
          <button
            onClick={open}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-2"
          >
            <IconCash className="h-4 w-4" /> Deposit
          </button>
        )}
      >
        {(close) => <FundForm type="deposit" username={username} available={available} close={close} />}
      </Modal>
      <Modal
        title="Withdraw"
        trigger={(open) => (
          <button
            onClick={open}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-2.5 text-sm font-bold text-ink/80 transition hover:border-lay/40 hover:text-lay"
          >
            <IconCash className="h-4 w-4" /> Withdraw
          </button>
        )}
      >
        {(close) => <FundForm type="withdraw" username={username} available={available} close={close} />}
      </Modal>
    </div>
  );
}
