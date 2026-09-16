"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { placeBet } from "@/lib/domain";
import { type ActionResult, OK, FAIL } from "@/lib/action-result";

export async function placeBetAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me) return FAIL("Session expired. Please sign in again.");
  if (me.role !== "client") return FAIL("Only client accounts can place bets.");

  const marketId = Number(formData.get("marketId"));
  const selection = String(formData.get("selection") ?? "");
  const stake = Number(String(formData.get("stake") ?? "").replace(/,/g, ""));

  if (!marketId) return FAIL("Market not found.");
  if (selection !== "A" && selection !== "B") return FAIL("Choose a team.");
  if (!Number.isFinite(stake) || stake <= 0) return FAIL("Enter a valid stake.");

  try {
    const bet = placeBet(me.id, marketId, selection, stake);
    revalidatePath("/play");
    revalidatePath("/play/bets");
    revalidatePath(`/play/match/${bet.match_id}`);
    return OK(`Bet placed on ${bet.selection_name} for ${bet.stake}.`);
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not place bet.");
  }
}
