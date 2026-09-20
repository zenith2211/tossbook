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
  adjustBalance,
  deleteUser,
  cancelMatch,
  deleteMatch,
  createAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
  tossMarket,
} from "@/lib/domain";
import { type ActionResult, OK, FAIL } from "@/lib/action-result";
import { DEFAULT_CLIENT_PASSWORD } from "@/lib/defaults";

function num(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

/** Revalidate everything an admin edit can be visible on. */
function refreshAdmin(...extra: string[]) {
  for (const p of ["/admin", "/admin/matches", "/admin/users", "/admin/bets", "/admin/user-mgmt", "/play", ...extra]) {
    revalidatePath(p);
  }
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
  // The form only asks for a username — the shared starter password is applied
  // here and handed back in the success message for the admin to pass on.
  const password = String(formData.get("password") ?? "") || DEFAULT_CLIENT_PASSWORD;
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
    refreshAdmin();
    return OK(`${username} · ${password}`);
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not create account.");
  }
}

/** Wallet controls on a user card: Add, Deduct and Set. */
export async function adjustBalanceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || !isUpline(me.role)) return FAIL("Not authorised.");
  const userId = num(formData.get("userId"));
  if (!isAncestorOf(me.id, userId) || userId === me.id) return FAIL("Not authorised for this account.");

  const raw = String(formData.get("mode") ?? "add");
  const mode = raw === "deduct" ? "deduct" : raw === "set" ? "set" : "add";
  const amount = num(formData.get("amount"), NaN);
  if (!Number.isFinite(amount)) return FAIL("Enter a valid amount.");

  try {
    const u = adjustBalance(userId, mode, amount, String(formData.get("remark") ?? "").trim(), me.id);
    refreshAdmin(`/admin/users/${userId}`);
    return OK(
      mode === "set"
        ? `Balance set to ₹${u.balance.toLocaleString("en-IN")}.`
        : `${mode === "add" ? "Added" : "Deducted"} ₹${amount.toLocaleString("en-IN")} — new balance ₹${u.balance.toLocaleString("en-IN")}.`,
    );
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not update the balance.");
  }
}

/** Permanently deletes an account and every row attached to it. */
export async function deleteUserAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || !isUpline(me.role)) return FAIL("Not authorised.");
  const userId = num(formData.get("userId"));
  if (!userId) return FAIL("Choose an account to delete.");
  if (!isAncestorOf(me.id, userId) || userId === me.id) return FAIL("Not authorised for this account.");
  if (String(formData.get("confirm") ?? "") !== "DELETE") {
    return FAIL('Type DELETE to confirm — this cannot be undone.');
  }
  const target = getUser(userId);
  if (!target) return FAIL("Account not found.");

  try {
    deleteUser(userId);
    refreshAdmin();
    return OK(`Account "${target.username}" and all of its data were deleted.`);
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not delete the account.");
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
  const liveTime = String(formData.get("liveTime") ?? "").trim();
  const liveIso = liveTime ? new Date(liveTime).toISOString() : null;
  const endTime = String(formData.get("endTime") ?? "").trim();
  const endIso = endTime ? new Date(endTime).toISOString() : null;
  if (endIso && liveIso && new Date(endIso).getTime() <= new Date(liveIso).getTime()) {
    return FAIL("Picks must close after the match goes live.");
  }

  // Optional match poster — either a pasted URL or an uploaded image sent as a
  // data URL. Cap the size so a huge upload can't bloat the row / page payload.
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  if (imageUrl && imageUrl.length > 1_500_000) {
    return FAIL("Poster image is too large — use an image under ~1 MB or paste a URL.");
  }

  const minStake = Math.max(1, num(formData.get("minStake"), 100));
  const maxStake = Math.max(minStake, num(formData.get("maxStake"), 50000));

  try {
    createMatch(
      {
        title: `${teamA} vs ${teamB}`,
        teamA,
        teamB,
        league,
        startTime: iso,
        liveTime: liveIso,
        endTime: endIso,
        rateA,
        rateB,
        imageUrl,
        minStake,
        maxStake,
      },
      me.id,
    );
    refreshAdmin();
    return OK(`Match "${teamA} vs ${teamB}" created.`);
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not create match.");
  }
}

/** Declare the toss winner straight from a match card. */
export async function declareTossAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return FAIL("Only admin can declare results.");
  const matchId = num(formData.get("matchId"));
  const side = String(formData.get("side") ?? "");
  if (side !== "A" && side !== "B") return FAIL("Choose a winning side.");
  const market = tossMarket(matchId);
  if (!market) return FAIL("This match has no toss market.");

  try {
    const out = settleMarket(market.id, side, me.id);
    const match = getMatch(matchId);
    const name = side === "A" ? match?.team_a : match?.team_b;
    refreshAdmin(`/admin/matches/${matchId}`);
    return OK(`${name} declared — ${out.settledBets} bet(s) settled (${out.winners} won, ${out.losers} lost).`);
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not declare the result.");
  }
}

/** Cancel a match — every open pick is refunded in full. */
export async function cancelMatchAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return FAIL("Only admin can cancel matches.");
  const matchId = num(formData.get("matchId"));
  try {
    const out = cancelMatch(matchId, me.id);
    refreshAdmin(`/admin/matches/${matchId}`);
    return OK(`Match cancelled — ${out.settledBets} pick(s) refunded.`);
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not cancel the match.");
  }
}

/** Push a match live right now, without waiting for its scheduled live time. */
export async function goLiveAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return FAIL("Only admin can change match status.");
  const matchId = num(formData.get("matchId"));
  const match = getMatch(matchId);
  if (!match) return FAIL("Match not found.");

  const now = new Date();
  if (match.end_time && new Date(match.end_time).getTime() <= now.getTime()) {
    return FAIL("Picks already closed for this match — edit the close time first.");
  }

  try {
    updateMatch(matchId, { liveTime: now.toISOString() });
    refreshAdmin(`/admin/matches/${matchId}`);
    return OK("Match is now live.");
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not take the match live.");
  }
}

/** Remove matches entirely — the per-card Delete and the bulk action. */
export async function deleteMatchesAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return FAIL("Only admin can delete matches.");
  const ids = String(formData.get("matchIds") ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!ids.length) return FAIL("Select at least one match.");

  try {
    for (const id of ids) deleteMatch(id);
    refreshAdmin();
    return OK(`Deleted ${ids.length} match${ids.length === 1 ? "" : "es"}.`);
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Could not delete the matches.");
  }
}

// --- Announcements --------------------------------------------------------
export async function createAnnouncementAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return FAIL("Only admin can post announcements.");
  const text = String(formData.get("text") ?? "").trim();
  if (text.length < 2) return FAIL("Write the announcement first.");
  const icon = String(formData.get("icon") ?? "info").trim() || "info";
  createAnnouncement(text, icon, me.id);
  revalidatePath("/admin/announcements");
  refreshAdmin();
  return OK("Announcement posted to the ticker.");
}

export async function toggleAnnouncementAction(formData: FormData): Promise<void> {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return;
  toggleAnnouncement(num(formData.get("id")));
  revalidatePath("/admin/announcements");
  refreshAdmin();
}

export async function deleteAnnouncementAction(formData: FormData): Promise<void> {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return;
  deleteAnnouncement(num(formData.get("id")));
  revalidatePath("/admin/announcements");
  refreshAdmin();
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
  const liveRaw = String(formData.get("liveTime") ?? "").trim();
  const endRaw = String(formData.get("endTime") ?? "").trim();
  const startIso = startRaw ? new Date(startRaw).toISOString() : match.start_time;
  const liveIso = liveRaw ? new Date(liveRaw).toISOString() : null;
  const endIso = endRaw ? new Date(endRaw).toISOString() : null;
  if (endIso && liveIso && new Date(endIso).getTime() <= new Date(liveIso).getTime()) {
    return FAIL("Picks must close after the match goes live.");
  }

  const imageRaw = String(formData.get("imageUrl") ?? "").trim();
  if (imageRaw.length > 1_500_000) {
    return FAIL("Poster image is too large — use an image under ~1 MB or paste a URL.");
  }

  try {
    updateMatch(matchId, {
      teamA,
      teamB,
      league,
      startTime: startIso,
      liveTime: liveIso,
      endTime: endIso,
      imageUrl: imageRaw || null,
    });
    // Odds and the stake ceiling live on the toss market, not the match row.
    // A settled market is frozen — its odds already priced the payouts — so
    // only the match details above change once a result is declared.
    const market = tossMarket(matchId);
    if (market && market.status !== "settled") {
      const rateA = num(formData.get("rateA"), market.rate_a);
      const rateB = num(formData.get("rateB"), market.rate_b);
      if (rateA <= 1 || rateB <= 1) return FAIL("Odds must be greater than 1.00 (e.g. 1.95, 2.50).");
      updateMarket(market.id, {
        rateA,
        rateB,
        maxStake: Math.max(1, num(formData.get("maxStake"), market.max_stake)),
      });
    }
    refreshAdmin(`/admin/matches/${matchId}`);
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
