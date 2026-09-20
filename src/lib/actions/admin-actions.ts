"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser, isUpline, isAncestorOf } from "@/lib/auth";
import { CHILD_ROLE } from "@/lib/types";
import {
  createDownlineUser,
  transferChips,
  setUserStatus,
  updateUserSettings,
  setPassword,
  getUser,
  createMatch,
  updateMarket,
  settleMarket,
  setMatchStatus,
  getMarket,
  getMatch,
  updateMatch,
} from "@/lib/domain";
import { type ActionResult, OK, FAIL } from "@/lib/action-result";

function num(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

// --- Accounts -------------------------------------------------------------
export async function createUserAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || !isUpline(me.role)) return FAIL("Not authorised.");
  const childRole = CHILD_ROLE[me.role];
  if (!childRole) return FAIL("Your role cannot create sub-accounts.");

  const username = String(formData.get("username") ?? "").trim();
  // Display name was removed from the form — default it to the username.
  const name = String(formData.get("name") ?? "").trim() || username;
  // Password defaults to a shared starter password when left blank.
  const password = String(formData.get("password") ?? "") || "Abcd123";
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return FAIL("Username must be 3–20 chars (letters, numbers, underscore).");
  }
  if (password.length < 6) return FAIL("Password must be at least 6 characters.");

  try {
    createDownlineUser(
      {
        username,
        name,
        password,
        role: childRole,
        parentId: me.id,
        openingBalance: Math.max(0, num(formData.get("openingBalance"))),
        sharePct: Math.min(100, Math.max(0, num(formData.get("sharePct")))),
        commissionPct: Math.min(100, Math.max(0, num(formData.get("commissionPct")))),
        creditLimit: Math.max(0, num(formData.get("creditLimit"))),
      },
      me.id,
    );
    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return OK(`Account "${username}" created.`);
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not create account.");
  }
}

export async function transferAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || !isUpline(me.role)) return FAIL("Not authorised.");
  const childId = num(formData.get("childId"));
  const child = getUser(childId);
  if (!child || child.parent_id !== me.id) return FAIL("You can only settle funds with your direct downline.");
  const amount = num(formData.get("amount"));
  const direction = String(formData.get("direction") ?? "deposit") === "withdraw" ? "withdraw" : "deposit";
  const remark = String(formData.get("remark") ?? "").trim();

  try {
    transferChips(me.id, childId, amount, direction, me.id, remark);
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${childId}`);
    revalidatePath("/admin");
    return OK(direction === "deposit" ? "Deposit successful." : "Withdrawal successful.");
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Transfer failed.");
  }
}

export async function toggleStatusAction(formData: FormData): Promise<void> {
  const me = await getSessionUser();
  if (!me || !isUpline(me.role)) return;
  const childId = num(formData.get("childId"));
  if (!isAncestorOf(me.id, childId) || childId === me.id) return;
  const child = getUser(childId);
  if (!child) return;
  setUserStatus(childId, child.status === "active" ? "locked" : "active");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${childId}`);
}

export async function updateSettingsAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || !isUpline(me.role)) return FAIL("Not authorised.");
  const childId = num(formData.get("childId"));
  if (!isAncestorOf(me.id, childId) || childId === me.id) return FAIL("Not authorised for this account.");
  try {
    updateUserSettings(childId, {
      name: String(formData.get("name") ?? "").trim() || undefined,
      sharePct: Math.min(100, Math.max(0, num(formData.get("sharePct")))),
      commissionPct: Math.min(100, Math.max(0, num(formData.get("commissionPct")))),
      creditLimit: Math.max(0, num(formData.get("creditLimit"))),
    });
    revalidatePath(`/admin/users/${childId}`);
    return OK("Settings saved.");
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not save.");
  }
}

export async function resetPasswordAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || !isUpline(me.role)) return FAIL("Not authorised.");
  const childId = num(formData.get("childId"));
  if (!isAncestorOf(me.id, childId) || childId === me.id) return FAIL("Not authorised for this account.");
  const pw = String(formData.get("password") ?? "");
  if (pw.length < 6) return FAIL("Password must be at least 6 characters.");
  // clearForceFlag=false → the client must change this temp password at next login.
  setPassword(childId, pw, false);
  revalidatePath(`/admin/users/${childId}`);
  return OK("Password reset. The client must change it at next login.");
}

// --- Matches & markets (admin only) --------------------------------------
export async function createMatchAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return FAIL("Only admin can create matches.");
  const teamA = String(formData.get("teamA") ?? "").trim();
  const teamB = String(formData.get("teamB") ?? "").trim();
  const league = String(formData.get("league") ?? "Cricket").trim() || "Cricket";
  const startTime = String(formData.get("startTime") ?? "").trim();
  if (!teamA || !teamB) return FAIL("Enter both team names.");
  const rateA = num(formData.get("rateA"), 1.95);
  const rateB = num(formData.get("rateB"), 1.95);
  if (rateA <= 1 || rateB <= 1) return FAIL("Odds must be greater than 1.00 (e.g. 1.95, 2.50).");
  const iso = startTime ? new Date(startTime).toISOString() : new Date().toISOString();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const endIso = endTime ? new Date(endTime).toISOString() : null;
  if (endIso && new Date(endIso).getTime() <= new Date(iso).getTime()) {
    return FAIL("Betting close time must be after the start time.");
  }

  // Optional match poster — either a pasted URL or an uploaded image sent as a
  // data URL. Cap the size so a huge upload can't bloat the row / page payload.
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  if (imageUrl && imageUrl.length > 1_500_000) {
    return FAIL("Poster image is too large — use an image under ~1 MB or paste a URL.");
  }

  const minStake = Math.max(1, num(formData.get("minStake"), 100));
  const maxStake = Math.max(minStake, num(formData.get("maxStake"), 100000));

  try {
    createMatch(
      { title: `${teamA} vs ${teamB}`, teamA, teamB, league, startTime: iso, endTime: endIso, rateA, rateB, imageUrl, minStake, maxStake },
      me.id,
    );
    revalidatePath("/admin/matches");
    revalidatePath("/play");
    return OK("Match created with Toss & Match Winner markets.");
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not create match.");
  }
}

export async function updateMatchAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return FAIL("Only admin can edit matches.");
  const matchId = num(formData.get("matchId"));
  const match = getMatch(matchId);
  if (!match) return FAIL("Match not found.");

  const teamA = String(formData.get("teamA") ?? "").trim();
  const teamB = String(formData.get("teamB") ?? "").trim();
  if (!teamA || !teamB) return FAIL("Enter both team names.");
  const league = String(formData.get("league") ?? "Cricket").trim() || "Cricket";

  const startRaw = String(formData.get("startTime") ?? "").trim();
  const endRaw = String(formData.get("endTime") ?? "").trim();
  const startIso = startRaw ? new Date(startRaw).toISOString() : match.start_time;
  const endIso = endRaw ? new Date(endRaw).toISOString() : null;
  if (endIso && new Date(endIso).getTime() <= new Date(startIso).getTime()) {
    return FAIL("Betting close time must be after the start time.");
  }

  try {
    updateMatch(matchId, { teamA, teamB, league, startTime: startIso, endTime: endIso });
    revalidatePath(`/admin/matches/${matchId}`);
    revalidatePath("/admin/matches");
    revalidatePath("/play");
    return OK("Match updated.");
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not update match.");
  }
}

export async function updateMarketAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return FAIL("Only admin can edit markets.");
  const marketId = num(formData.get("marketId"));
  const market = getMarket(marketId);
  if (!market) return FAIL("Market not found.");
  try {
    updateMarket(marketId, {
      rateA: num(formData.get("rateA"), market.rate_a),
      rateB: num(formData.get("rateB"), market.rate_b),
      status: (String(formData.get("status") ?? market.status) as typeof market.status) || market.status,
      minStake: num(formData.get("minStake"), market.min_stake),
      maxStake: num(formData.get("maxStake"), market.max_stake),
    });
    revalidatePath(`/admin/matches/${market.match_id}`);
    revalidatePath("/play");
    return OK("Market updated.");
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not update market.");
  }
}

export async function settleMarketAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return FAIL("Only admin can declare results.");
  const marketId = num(formData.get("marketId"));
  const result = String(formData.get("result") ?? "");
  if (!["A", "B", "void"].includes(result)) return FAIL("Choose a valid result.");
  try {
    const out = settleMarket(marketId, result as "A" | "B" | "void", me.id);
    const market = getMarket(marketId);
    if (market) revalidatePath(`/admin/matches/${market.match_id}`);
    revalidatePath("/admin/matches");
    revalidatePath("/admin");
    revalidatePath("/play");
    return OK(`Settled ${out.settledBets} bet(s): ${out.winners} won, ${out.losers} lost.`);
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not settle market.");
  }
}

export async function setMatchStatusAction(formData: FormData): Promise<void> {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return;
  const matchId = num(formData.get("matchId"));
  const status = String(formData.get("status") ?? "");
  if (!["upcoming", "live", "closed", "settled"].includes(status)) return;
  setMatchStatus(matchId, status as "upcoming" | "live" | "closed" | "settled");
  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${matchId}`);
  revalidatePath("/play");
}
