"use server";

import { getSessionUser } from "@/lib/auth";
import { available, getUser } from "@/lib/domain";
import { type ActionResult, OK, FAIL } from "@/lib/action-result";

/**
 * A client asks the admin to add (deposit/refill) or take out (withdraw) money.
 * We don't move any balance here — the admin does that manually after seeing the
 * request. If a Telegram bot is configured, the request is delivered straight to
 * the admin's chat; otherwise the client is redirected to Telegram to send it.
 */
export async function requestFundsAction(
  type: "deposit" | "withdraw",
  amount: number,
): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me) return FAIL("Session expired. Please sign in again.");
  if (me.role !== "client") return FAIL("Only client accounts can request funds.");
  if (!Number.isFinite(amount) || amount <= 0) return FAIL("Enter a valid amount.");

  const fresh = getUser(me.id);
  if (!fresh) return FAIL("Account not found.");
  if (type === "withdraw" && available(fresh) < amount) {
    return FAIL("You cannot withdraw more than your available balance.");
  }

  const inr = (n: number) => n.toLocaleString("en-IN");
  const label = type === "deposit" ? "💰 Refill / Deposit" : "🏧 Withdrawal";
  const text =
    `${label} request\n\n` +
    `User: @${me.username} (ID ${me.id})\n` +
    `Name: ${me.name}\n` +
    `Amount: ₹${inr(amount)}\n` +
    `Current balance: ₹${inr(fresh.balance)}`;

  const sent = await notifyAdminTelegram(text);
  // "auto" → delivered by bot; "manual" → client should open Telegram to send.
  return OK(sent ? "auto" : "manual");
}

async function notifyAdminTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
