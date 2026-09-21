import { db, hashPassword, newPublicId } from "./db";
import { round2 } from "./format";
import type {
  Announcement,
  Bet,
  LedgerEntry,
  Market,
  Match,
  MatchPhase,
  Request,
  Role,
  User,
} from "./types";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export function getUser(id: number): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function getUserByUsername(username: string): User | undefined {
  return db
    .prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE")
    .get(username) as User | undefined;
}

export function available(u: { balance: number; exposure: number }): number {
  return round2(u.balance - u.exposure);
}

export function listChildren(parentId: number): User[] {
  return db
    .prepare("SELECT * FROM users WHERE parent_id = ? ORDER BY role DESC, username")
    .all(parentId) as User[];
}

export interface CreateUserInput {
  username: string;
  password: string;
  name: string;
  role: Role;
  parentId: number;
  openingBalance: number;
  sharePct: number;
  commissionPct: number;
  creditLimit: number;
}

export function createDownlineUser(input: CreateUserInput, createdBy: number): User {
  if (getUserByUsername(input.username)) {
    throw new Error("Username already taken.");
  }
  const parent = getUser(input.parentId);
  if (!parent) throw new Error("Parent account not found.");
  if (input.openingBalance > 0 && available(parent) < input.openingBalance) {
    throw new Error("Insufficient balance in your account for this opening balance.");
  }

  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO users (username, password, name, role, parent_id, balance, share_pct, commission_pct, credit_limit, must_change_pw, public_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      )
      .run(
        input.username.trim(),
        hashPassword(input.password),
        input.name.trim(),
        input.role,
        input.parentId,
        round2(input.openingBalance),
        input.sharePct,
        input.commissionPct,
        input.creditLimit,
        newPublicId(),
      );
    const newId = info.lastInsertRowid as number;

    if (input.openingBalance > 0) {
      // Move funds from parent to the new account.
      const newParentBal = round2(parent.balance - input.openingBalance);
      db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(newParentBal, parent.id);
      writeLedger(parent.id, "transfer_out", -input.openingBalance, newParentBal, "manual", newId, `Opening balance to ${input.username}`, createdBy);
      writeLedger(newId, "opening", input.openingBalance, round2(input.openingBalance), "manual", null, "Opening balance", createdBy);
    }
    return newId;
  });

  const id = tx();
  return getUser(id)!;
}

export function setUserStatus(id: number, status: "active" | "locked") {
  db.prepare("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

export function updateUserSettings(
  id: number,
  fields: { name?: string; sharePct?: number; commissionPct?: number; creditLimit?: number },
) {
  const cur = getUser(id);
  if (!cur) throw new Error("Account not found.");
  db.prepare(
    `UPDATE users SET name = ?, share_pct = ?, commission_pct = ?, credit_limit = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(
    fields.name ?? cur.name,
    fields.sharePct ?? cur.share_pct,
    fields.commissionPct ?? cur.commission_pct,
    fields.creditLimit ?? cur.credit_limit,
    id,
  );
}

export function setPassword(id: number, newPassword: string, clearForceFlag = true) {
  db.prepare(
    `UPDATE users SET password = ?, must_change_pw = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(hashPassword(newPassword), clearForceFlag ? 0 : 1, id);
}

/**
 * Admin wallet controls: Add / Deduct credit a client without touching the
 * admin float, and Set overwrites the balance outright. Every one writes a
 * ledger row so the client's passbook stays a complete record.
 */
export function adjustBalance(
  userId: number,
  mode: "add" | "deduct" | "set",
  amount: number,
  remark: string,
  createdBy: number,
): User {
  const user = getUser(userId);
  if (!user) throw new Error("Account not found.");
  amount = round2(amount);
  if (mode === "set") {
    if (amount < 0) throw new Error("Balance cannot be negative.");
  } else if (!(amount > 0)) {
    throw new Error("Amount must be greater than zero.");
  }

  const next = mode === "add" ? round2(user.balance + amount) : mode === "deduct" ? round2(user.balance - amount) : amount;
  if (next < 0) throw new Error("That would take the balance below zero.");
  if (next < user.exposure) {
    throw new Error(`This client has ${user.exposure} held in open bets — the balance cannot go below that.`);
  }

  const delta = round2(next - user.balance);
  const tx = db.transaction(() => {
    db.prepare("UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ?").run(next, userId);
    writeLedger(
      userId,
      delta >= 0 ? "deposit" : "withdraw",
      delta,
      next,
      "admin",
      createdBy,
      remark || (mode === "set" ? "Balance set by admin" : delta >= 0 ? "Added by admin" : "Deducted by admin"),
      createdBy,
    );
  });
  tx();
  return getUser(userId)!;
}

/**
 * Permanently removes an account and everything attached to it. Open bets
 * simply disappear with the account, so this is only offered for accounts the
 * admin really wants gone.
 */
export function deleteUser(userId: number): void {
  const user = getUser(userId);
  if (!user) throw new Error("Account not found.");
  if (user.role === "admin") throw new Error("Admin accounts cannot be deleted.");
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM bets WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM ledger WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM requests WHERE user_id = ? OR parent_id = ?").run(userId, userId);
    db.prepare("UPDATE users SET parent_id = NULL WHERE parent_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  });
  tx();
}

/** Short reference shown next to a username in the admin list. */
export function shortId(u: { public_id: string | null; id: number }): string {
  return (u.public_id ?? String(u.id)).slice(0, 13);
}

// ---------------------------------------------------------------------------
// Fund transfer (deposit = give down, withdraw = take back)
// ---------------------------------------------------------------------------
export function transferChips(
  parentId: number,
  childId: number,
  amount: number,
  direction: "deposit" | "withdraw",
  createdBy: number,
  remark: string,
) {
  if (amount <= 0) throw new Error("Amount must be greater than zero.");
  const parent = getUser(parentId);
  const child = getUser(childId);
  if (!parent || !child) throw new Error("Account not found.");
  if (child.parent_id !== parent.id) throw new Error("You can only settle funds with your direct downline.");

  const tx = db.transaction(() => {
    if (direction === "deposit") {
      if (available(parent) < amount) throw new Error("Insufficient balance in your account.");
      const pBal = round2(parent.balance - amount);
      const cBal = round2(child.balance + amount);
      db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(pBal, parent.id);
      db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(cBal, child.id);
      writeLedger(parent.id, "transfer_out", -amount, pBal, "manual", child.id, remark || `Deposit to ${child.username}`, createdBy);
      writeLedger(child.id, "deposit", amount, cBal, "manual", parent.id, remark || `Deposit from ${parent.username}`, createdBy);
    } else {
      if (available(child) < amount) throw new Error("Insufficient balance in the downline account.");
      const cBal = round2(child.balance - amount);
      const pBal = round2(parent.balance + amount);
      db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(cBal, child.id);
      db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(pBal, parent.id);
      writeLedger(child.id, "withdraw", -amount, cBal, "manual", parent.id, remark || `Withdraw by ${parent.username}`, createdBy);
      writeLedger(parent.id, "transfer_in", amount, pBal, "manual", child.id, remark || `Withdraw from ${child.username}`, createdBy);
    }
  });
  tx();
}

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------
export function writeLedger(
  userId: number,
  type: string,
  amount: number,
  balanceAfter: number,
  refType: string | null,
  refId: number | null,
  remark: string,
  createdBy: number | null,
) {
  db.prepare(
    `INSERT INTO ledger (user_id, type, amount, balance_after, ref_type, ref_id, remark, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(userId, type, round2(amount), round2(balanceAfter), refType, refId, remark, createdBy);
}

export function listLedger(userId: number, limit = 200): LedgerEntry[] {
  return db
    .prepare("SELECT * FROM ledger WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .all(userId, limit) as LedgerEntry[];
}

// ---------------------------------------------------------------------------
// Deposit / withdraw requests (client asks → upline approves)
// ---------------------------------------------------------------------------
export function createRequest(userId: number, type: "deposit" | "withdraw", amount: number, note: string): Request {
  const user = getUser(userId);
  if (!user) throw new Error("Account not found.");
  amount = round2(amount);
  if (!(amount > 0)) throw new Error("Enter a valid amount.");
  if (type === "withdraw" && available(user) < amount) {
    throw new Error("You cannot withdraw more than your available balance.");
  }
  const pending = (
    db.prepare("SELECT COUNT(*) AS n FROM requests WHERE user_id = ? AND status = 'pending'").get(userId) as { n: number }
  ).n;
  if (pending >= 5) throw new Error("You already have several pending requests. Please wait for them to be processed.");

  const info = db
    .prepare(`INSERT INTO requests (user_id, parent_id, type, amount, note) VALUES (?, ?, ?, ?, ?)`)
    .run(userId, user.parent_id, type, amount, note.slice(0, 200));
  return db.prepare("SELECT * FROM requests WHERE id = ?").get(info.lastInsertRowid as number) as Request;
}

export function listRequestsForUser(userId: number, limit = 100): Request[] {
  return db
    .prepare("SELECT * FROM requests WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .all(userId, limit) as Request[];
}

export interface RequestRow extends Request {
  username: string;
  name: string;
}

export function listRequests(userIds: number[], status?: Request["status"]): RequestRow[] {
  if (!userIds.length) return [];
  const params: unknown[] = [...userIds];
  let clause = `r.user_id IN (${userIds.map(() => "?").join(",")})`;
  if (status) {
    clause += " AND r.status = ?";
    params.push(status);
  }
  return db
    .prepare(
      `SELECT r.*, u.username AS username, u.name AS name
       FROM requests r JOIN users u ON u.id = r.user_id
       WHERE ${clause} ORDER BY (r.status = 'pending') DESC, r.id DESC LIMIT 300`,
    )
    .all(...params) as RequestRow[];
}

export function countPendingRequests(userIds: number[]): number {
  if (!userIds.length) return 0;
  return (
    db
      .prepare(`SELECT COUNT(*) AS n FROM requests WHERE status='pending' AND user_id IN (${userIds.map(() => "?").join(",")})`)
      .get(...userIds) as { n: number }
  ).n;
}

export function decideRequest(requestId: number, decision: "approve" | "reject", deciderId: number) {
  const req = db.prepare("SELECT * FROM requests WHERE id = ?").get(requestId) as Request | undefined;
  if (!req) throw new Error("Request not found.");
  if (req.status !== "pending") throw new Error("This request has already been processed.");

  const tx = db.transaction(() => {
    if (decision === "approve") {
      if (req.parent_id == null) throw new Error("This account has no upline to settle with.");
      // Funds always flow between the client and their DIRECT parent.
      transferChips(
        req.parent_id,
        req.user_id,
        req.amount,
        req.type,
        deciderId,
        req.type === "deposit" ? "Deposit request approved" : "Withdrawal request approved",
      );
    }
    db.prepare(
      "UPDATE requests SET status = ?, decided_by = ?, decided_at = datetime('now') WHERE id = ?",
    ).run(decision === "approve" ? "approved" : "rejected", deciderId, requestId);
  });
  tx();
}

// ---------------------------------------------------------------------------
// Matches & markets
// ---------------------------------------------------------------------------
export function listMatches(statuses?: Match["status"][]): Match[] {
  if (statuses && statuses.length) {
    const placeholders = statuses.map(() => "?").join(",");
    return db
      .prepare(`SELECT * FROM matches WHERE status IN (${placeholders}) ORDER BY start_time ASC`)
      .all(...statuses) as Match[];
  }
  return db.prepare("SELECT * FROM matches ORDER BY start_time DESC").all() as Match[];
}

export function getMatch(id: number): Match | undefined {
  return db.prepare("SELECT * FROM matches WHERE id = ?").get(id) as Match | undefined;
}

export function listMarkets(matchId: number): Market[] {
  return db
    .prepare("SELECT * FROM markets WHERE match_id = ? ORDER BY type")
    .all(matchId) as Market[];
}

export function getMarket(id: number): Market | undefined {
  return db.prepare("SELECT * FROM markets WHERE id = ?").get(id) as Market | undefined;
}

export interface ResultRow {
  market_id: number;
  match_id: number;
  title: string;
  team_a: string;
  team_b: string;
  league: string;
  market_type: "toss" | "match_winner";
  name: string;
  result: "A" | "B" | "void" | null;
  settled_at: string | null;
  rate_a: number;
  rate_b: number;
  bets: number;
  volume: number;
}

export function listResults(limit = 100): ResultRow[] {
  return db
    .prepare(
      `SELECT m.id AS market_id, mt.id AS match_id, mt.title, mt.team_a, mt.team_b, mt.league,
              m.type AS market_type, m.name, m.result, m.settled_at, m.rate_a, m.rate_b,
              (SELECT COUNT(*) FROM bets b WHERE b.market_id = m.id) AS bets,
              (SELECT COALESCE(SUM(b.stake),0) FROM bets b WHERE b.market_id = m.id AND b.status != 'void') AS volume
       FROM markets m JOIN matches mt ON mt.id = m.match_id
       WHERE m.status = 'settled'
       ORDER BY m.settled_at DESC LIMIT ?`,
    )
    .all(limit) as ResultRow[];
}

// Default stake limits for a new match's markets (admin can fine-tune per market).
export const DEFAULT_MIN_STAKE = 100;
export const DEFAULT_MAX_STAKE = 100_000;

export function createMatch(
  data: {
    title: string;
    teamA: string;
    teamB: string;
    league: string;
    startTime: string;
    liveTime?: string | null;
    endTime?: string | null;
    rateA?: number;
    rateB?: number;
    imageUrl?: string | null;
    minStake?: number;
    maxStake?: number;
  },
  createdBy: number,
): Match {
  const rateA = data.rateA && data.rateA > 1 ? round2(data.rateA) : 1.95;
  const rateB = data.rateB && data.rateB > 1 ? round2(data.rateB) : 1.95;
  const minStake = data.minStake && data.minStake > 0 ? round2(data.minStake) : DEFAULT_MIN_STAKE;
  const maxStake = data.maxStake && data.maxStake > minStake ? round2(data.maxStake) : DEFAULT_MAX_STAKE;
  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO matches (title, team_a, team_b, league, start_time, live_time, end_time, image_url, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)`,
      )
      .run(
        data.title,
        data.teamA,
        data.teamB,
        data.league,
        data.startTime,
        data.liveTime ?? null,
        data.endTime ?? null,
        data.imageUrl ?? null,
        createdBy,
      );
    const matchId = info.lastInsertRowid as number;
    db.prepare(
      `INSERT INTO markets (match_id, type, name, status, rate_a, rate_b, min_stake, max_stake) VALUES (?, 'toss', 'Toss Winner', 'open', ?, ?, ?, ?)`,
    ).run(matchId, rateA, rateB, minStake, maxStake);
    return matchId;
  });
  return getMatch(tx())!;
}

export function setMatchStatus(id: number, status: Match["status"]) {
  db.prepare("UPDATE matches SET status = ? WHERE id = ?").run(status, id);
}

export function updateMatch(
  id: number,
  fields: {
    teamA?: string;
    teamB?: string;
    league?: string;
    startTime?: string;
    liveTime?: string | null;
    endTime?: string | null;
    imageUrl?: string | null;
  },
): Match {
  const cur = getMatch(id);
  if (!cur) throw new Error("Match not found.");
  const teamA = (fields.teamA ?? cur.team_a).trim() || cur.team_a;
  const teamB = (fields.teamB ?? cur.team_b).trim() || cur.team_b;
  const league = (fields.league ?? cur.league).trim() || cur.league;
  const startTime = fields.startTime || cur.start_time;
  const liveTime = fields.liveTime !== undefined ? fields.liveTime : cur.live_time;
  const endTime = fields.endTime !== undefined ? fields.endTime : cur.end_time;
  const imageUrl = fields.imageUrl !== undefined ? fields.imageUrl : cur.image_url;
  db.prepare(
    `UPDATE matches SET title = ?, team_a = ?, team_b = ?, league = ?, start_time = ?, live_time = ?, end_time = ?, image_url = ? WHERE id = ?`,
  ).run(`${teamA} vs ${teamB}`, teamA, teamB, league, startTime, liveTime, endTime, imageUrl, id);
  return getMatch(id)!;
}

/** The single toss market every match owns. */
export function tossMarket(matchId: number): Market | undefined {
  return db.prepare("SELECT * FROM markets WHERE match_id = ? AND type = 'toss'").get(matchId) as Market | undefined;
}

/**
 * Where a match sits right now. Settled markets pin the phase (a voided toss
 * reads as Cancelled, a declared one as Closed); otherwise the auto-status
 * times decide, and a match with no times configured is still Pending.
 */
export function matchPhase(match: Match, market?: Market | null, now = Date.now()): MatchPhase {
  if (market?.result === "void") return "cancelled";
  if (market?.result === "A" || market?.result === "B") return "closed";
  if (match.status === "settled" || match.status === "closed") return "closed";

  const closesAt = match.end_time ? new Date(match.end_time).getTime() : null;
  if (closesAt !== null && closesAt <= now) return "closed";

  const livesAt = match.live_time ? new Date(match.live_time).getTime() : null;
  if (livesAt === null && closesAt === null) return "pending";
  if (livesAt !== null && livesAt <= now) return "live";
  if (livesAt === null && closesAt !== null) return "live";
  return "upcoming";
}

export interface MatchOverview {
  match: Match;
  market: Market | null;
  phase: MatchPhase;
  /** Declared winner name, when the toss has been settled to a side. */
  winner: string | null;
  betsA: number;
  betsB: number;
  stakeA: number;
  stakeB: number;
  /** Money the book pays out if that side wins (stake + profit for backers). */
  payoutA: number;
  payoutB: number;
  /** Book profit if that side wins: everything staked minus that side's payout. */
  houseIfA: number;
  houseIfB: number;
  totalBets: number;
  totalStake: number;
}

function overviewFor(match: Match): MatchOverview {
  const market = tossMarket(match.id) ?? null;
  const rows = market
    ? (db
        .prepare(
          `SELECT selection, COUNT(*) AS n, COALESCE(SUM(stake), 0) AS stake,
                  COALESCE(SUM(stake * rate), 0) AS payout
           FROM bets WHERE market_id = ? AND status != 'void' GROUP BY selection`,
        )
        .all(market.id) as { selection: "A" | "B"; n: number; stake: number; payout: number }[])
    : [];

  const a = rows.find((r) => r.selection === "A");
  const b = rows.find((r) => r.selection === "B");
  const stakeA = round2(a?.stake ?? 0);
  const stakeB = round2(b?.stake ?? 0);
  const payoutA = round2(a?.payout ?? 0);
  const payoutB = round2(b?.payout ?? 0);
  const totalStake = round2(stakeA + stakeB);

  return {
    match,
    market,
    phase: matchPhase(match, market),
    winner:
      market?.result === "A" ? match.team_a : market?.result === "B" ? match.team_b : null,
    betsA: a?.n ?? 0,
    betsB: b?.n ?? 0,
    stakeA,
    stakeB,
    payoutA,
    payoutB,
    houseIfA: round2(totalStake - payoutA),
    houseIfB: round2(totalStake - payoutB),
    totalBets: (a?.n ?? 0) + (b?.n ?? 0),
    totalStake,
  };
}

/** Every match with the numbers the admin list needs, newest first. */
export function listMatchOverviews(): MatchOverview[] {
  return (db.prepare("SELECT * FROM matches ORDER BY id DESC").all() as Match[]).map(overviewFor);
}

export function getMatchOverview(id: number): MatchOverview | null {
  const match = getMatch(id);
  return match ? overviewFor(match) : null;
}

/** Cancel a match: every open bet is refunded and the card reads CANCELLED. */
export function cancelMatch(matchId: number, createdBy: number): SettleResult {
  const market = tossMarket(matchId);
  if (!market) throw new Error("This match has no toss market.");
  if (market.status === "settled") throw new Error("This match is already settled.");
  return settleMarket(market.id, "void", createdBy);
}

/** Remove a match outright, releasing the exposure any open bets still hold. */
export function deleteMatch(matchId: number): void {
  const match = getMatch(matchId);
  if (!match) throw new Error("Match not found.");
  const openBets = db.prepare("SELECT * FROM bets WHERE match_id = ? AND status = 'open'").all(matchId) as Bet[];
  const tx = db.transaction(() => {
    for (const bet of openBets) {
      const user = getUser(bet.user_id);
      if (!user) continue;
      db.prepare("UPDATE users SET exposure = ? WHERE id = ?").run(round2(Math.max(0, user.exposure - bet.stake)), user.id);
    }
    db.prepare("DELETE FROM bets WHERE match_id = ?").run(matchId);
    db.prepare("DELETE FROM markets WHERE match_id = ?").run(matchId);
    db.prepare("DELETE FROM matches WHERE id = ?").run(matchId);
  });
  tx();
}

// ---------------------------------------------------------------------------
// Announcements — the scrolling ticker under the header
// ---------------------------------------------------------------------------
export function listAnnouncements(onlyActive = false): Announcement[] {
  const clause = onlyActive ? "WHERE active = 1" : "";
  return db
    .prepare(`SELECT * FROM announcements ${clause} ORDER BY sort_order ASC, id DESC`)
    .all() as Announcement[];
}

export function createAnnouncement(text: string, icon: string, createdBy: number): Announcement {
  const info = db
    .prepare("INSERT INTO announcements (text, icon, created_by) VALUES (?, ?, ?)")
    .run(text.trim().slice(0, 300), icon, createdBy);
  return db.prepare("SELECT * FROM announcements WHERE id = ?").get(info.lastInsertRowid as number) as Announcement;
}

export function toggleAnnouncement(id: number): void {
  db.prepare("UPDATE announcements SET active = 1 - active WHERE id = ?").run(id);
}

export function deleteAnnouncement(id: number): void {
  db.prepare("DELETE FROM announcements WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// Database health — what the "DB Setup" panel reports
// ---------------------------------------------------------------------------
export interface DbTableInfo {
  name: string;
  rows: number;
}

export function dbOverview(): { tables: DbTableInfo[]; integrity: string; journal: string; pageSizeKb: number; sizeKb: number } {
  const names = (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as { name: string }[]
  ).map((r) => r.name);

  const tables = names.map((name) => ({
    name,
    rows: (db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get() as { n: number }).n,
  }));

  const integrity = (db.pragma("integrity_check", { simple: true }) as string) ?? "unknown";
  const journal = String(db.pragma("journal_mode", { simple: true }) ?? "");
  const pageSize = Number(db.pragma("page_size", { simple: true }) ?? 4096);
  const pageCount = Number(db.pragma("page_count", { simple: true }) ?? 0);

  return {
    tables,
    integrity,
    journal,
    pageSizeKb: Math.round(pageSize / 1024),
    sizeKb: Math.round((pageSize * pageCount) / 1024),
  };
}

export function updateMarket(
  id: number,
  fields: { rateA?: number; rateB?: number; status?: Market["status"]; minStake?: number; maxStake?: number },
) {
  const cur = getMarket(id);
  if (!cur) throw new Error("Market not found.");
  if (cur.status === "settled") throw new Error("Market is already settled.");
  db.prepare(
    `UPDATE markets SET rate_a = ?, rate_b = ?, status = ?, min_stake = ?, max_stake = ? WHERE id = ?`,
  ).run(
    fields.rateA ?? cur.rate_a,
    fields.rateB ?? cur.rate_b,
    fields.status ?? cur.status,
    fields.minStake ?? cur.min_stake,
    fields.maxStake ?? cur.max_stake,
    id,
  );
}

// ---------------------------------------------------------------------------
// Betting
// ---------------------------------------------------------------------------
export function placeBet(
  userId: number,
  marketId: number,
  selection: "A" | "B",
  stake: number,
): Bet {
  const user = getUser(userId);
  if (!user) throw new Error("Account not found.");
  if (user.role !== "client") throw new Error("Only client accounts can place bets.");
  if (user.status === "locked") throw new Error("Your account is locked.");

  const market = getMarket(marketId);
  if (!market) throw new Error("Market not found.");
  if (market.status !== "open") throw new Error("This market is not open for betting.");

  const match = getMatch(market.match_id);
  if (!match) throw new Error("Match not found.");
  if (match.status === "settled" || match.status === "closed") {
    throw new Error("This match is closed.");
  }
  if (match.end_time && new Date(match.end_time).getTime() <= Date.now()) {
    throw new Error("Betting is closed for this match.");
  }

  // One-sided rule: a client may only back ONE team per market. They can add
  // more to the side they already backed, but not bet on the opposite side.
  const opposite = selection === "A" ? "B" : "A";
  const hasOpposite = (
    db
      .prepare("SELECT COUNT(*) AS n FROM bets WHERE user_id = ? AND market_id = ? AND status = 'open' AND selection = ?")
      .get(userId, marketId, opposite) as { n: number }
  ).n;
  if (hasOpposite > 0) {
    const otherTeam = opposite === "A" ? match.team_a : match.team_b;
    throw new Error(`You already backed ${otherTeam} in this market — you can only add more to that side.`);
  }

  stake = round2(stake);
  if (!(stake > 0)) throw new Error("Enter a valid stake.");
  if (stake < market.min_stake) throw new Error(`Minimum stake is ${market.min_stake}.`);
  if (stake > market.max_stake) throw new Error(`Maximum stake is ${market.max_stake}.`);
  if (available(user) < stake) throw new Error("Insufficient balance for this stake.");

  const rate = selection === "A" ? market.rate_a : market.rate_b;
  const selectionName = selection === "A" ? match.team_a : match.team_b;
  const potentialWin = round2(stake * (rate - 1));

  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO bets (user_id, match_id, market_id, market_type, selection, selection_name, stake, rate, potential_win)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(userId, match.id, market.id, market.type, selection, selectionName, stake, rate, potentialWin);
    const newExposure = round2(user.exposure + stake);
    db.prepare("UPDATE users SET exposure = ? WHERE id = ?").run(newExposure, userId);
    return info.lastInsertRowid as number;
  });

  return db.prepare("SELECT * FROM bets WHERE id = ?").get(tx()) as Bet;
}

export function cancelBet(userId: number, betId: number): Bet {
  const user = getUser(userId);
  if (!user) throw new Error("Account not found.");

  const bet = db.prepare("SELECT * FROM bets WHERE id = ?").get(betId) as Bet | undefined;
  if (!bet) throw new Error("Bet not found.");
  if (bet.user_id !== userId) throw new Error("This bet is not on your account.");
  if (bet.status !== "open") throw new Error("Only open bets can be cancelled.");

  const market = getMarket(bet.market_id);
  if (!market || market.status === "settled") throw new Error("This market is already settled.");

  const match = getMatch(bet.match_id);
  if (match) {
    if (match.status === "settled" || match.status === "closed") {
      throw new Error("This match is closed — the bet can no longer be cancelled.");
    }
    if (match.end_time && new Date(match.end_time).getTime() <= Date.now()) {
      throw new Error("Betting is closed — this bet can no longer be cancelled.");
    }
  }

  const tx = db.transaction(() => {
    // The stake was only held as exposure (never debited from balance), so
    // cancelling simply releases that hold. The bet is voided and then shows
    // under the client's "Cancelled" filter.
    const releasedExposure = round2(Math.max(0, user.exposure - bet.stake));
    db.prepare("UPDATE users SET exposure = ? WHERE id = ?").run(releasedExposure, user.id);
    db.prepare(
      "UPDATE bets SET status = 'void', result_pl = 0, void_reason = 'cancelled', settled_at = datetime('now') WHERE id = ?",
    ).run(bet.id);
  });
  tx();

  return db.prepare("SELECT * FROM bets WHERE id = ?").get(bet.id) as Bet;
}

export function listBetsForUser(userId: number, limit = 200): Bet[] {
  return db
    .prepare("SELECT * FROM bets WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .all(userId, limit) as Bet[];
}

export interface BetRow extends Bet {
  username: string;
  match_title: string;
  match_end_time: string | null;
}

export function listBets(filter: { userIds?: number[]; marketId?: number; matchId?: number; status?: string } = {}): BetRow[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.userIds) {
    where.push(`b.user_id IN (${filter.userIds.map(() => "?").join(",")})`);
    params.push(...filter.userIds);
  }
  if (filter.marketId) {
    where.push("b.market_id = ?");
    params.push(filter.marketId);
  }
  if (filter.matchId) {
    where.push("b.match_id = ?");
    params.push(filter.matchId);
  }
  if (filter.status) {
    where.push("b.status = ?");
    params.push(filter.status);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return db
    .prepare(
      `SELECT b.*, u.username AS username, m.title AS match_title, m.end_time AS match_end_time
       FROM bets b JOIN users u ON u.id = b.user_id JOIN matches m ON m.id = b.match_id
       ${clause} ORDER BY b.id DESC LIMIT 500`,
    )
    .all(...params) as BetRow[];
}

// ---------------------------------------------------------------------------
// Passbook / activity feed — a single time-sorted log of everything on an
// account: deposits, withdrawals, bet placements, cancellations/refunds, and
// settled wins/losses. Cash rows (deposits/withdrawals/wins/losses) carry the
// running balance and count toward the In/Out/Net totals; bet placements and
// cancellations are informational (they don't move the balance in this book).
// ---------------------------------------------------------------------------
export type ActivityKind =
  | "deposit"
  | "withdraw"
  | "bet_placed"
  | "bet_won"
  | "bet_lost"
  | "refund"
  | "adjust";

export interface Activity {
  key: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  amount: number;
  balanceAfter: number | null;
  cash: boolean;
  at: string;
}

const LEDGER_MAP: Record<string, { title: string; kind: ActivityKind }> = {
  opening: { title: "Opening balance", kind: "deposit" },
  deposit: { title: "Deposit", kind: "deposit" },
  withdraw: { title: "Withdraw", kind: "withdraw" },
  settle_win: { title: "Bet Won", kind: "bet_won" },
  settle_loss: { title: "Bet Lost", kind: "bet_lost" },
  transfer_in: { title: "Transfer in", kind: "deposit" },
  transfer_out: { title: "Transfer out", kind: "withdraw" },
};

export function listActivity(userId: number, limit = 2000): Activity[] {
  type Ev = { key: string; kind: ActivityKind; title: string; detail: string; delta: number; at: string };
  const evs: Ev[] = [];

  // Cash movements (deposits, withdrawals, transfers). Bet settlements are
  // derived from the bets below so the running balance stays exact.
  for (const r of listLedger(userId, limit)) {
    if (r.type === "settle_win" || r.type === "settle_loss") continue;
    const m = LEDGER_MAP[r.type] ?? { title: r.type.replace(/_/g, " "), kind: "adjust" as ActivityKind };
    evs.push({ key: `l${r.id}`, kind: m.kind, title: m.title, detail: r.remark || "", delta: r.amount, at: r.created_at });
  }

  // Placing a bet holds the stake (spendable balance drops); the outcome returns
  // money — win = stake + profit, refund/void = stake back, loss = nothing back.
  for (const b of listBets({ userIds: [userId] })) {
    const detail = `${b.match_title} · ${b.selection_name} · ${b.rate.toFixed(2)}x`;
    if (b.status === "lost") {
      evs.push({ key: `bp${b.id}`, kind: "bet_lost", title: "Bet Lost", detail, delta: -b.stake, at: b.placed_at });
    } else {
      evs.push({ key: `bp${b.id}`, kind: "bet_placed", title: "Bet Placed", detail, delta: -b.stake, at: b.placed_at });
    }
    if (b.status === "won") {
      evs.push({ key: `bw${b.id}`, kind: "bet_won", title: "Bet Won", detail, delta: round2(b.stake + b.result_pl), at: b.settled_at ?? b.placed_at });
    } else if (b.status === "void") {
      evs.push({
        key: `br${b.id}`,
        kind: "refund",
        title: b.void_reason === "refunded" ? "Bet refunded (match voided)" : "Bet cancelled — refund",
        detail,
        delta: b.stake,
        at: b.settled_at ?? b.placed_at,
      });
    }
  }

  // Replay oldest → newest to compute the running (spendable) balance per row.
  evs.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.key < b.key ? -1 : 1));

  // The replay has to land on the account's spendable balance. If it doesn't,
  // money arrived without a ledger row (an account seeded or adjusted directly),
  // so open the book with the difference instead of drifting negative.
  const user = getUser(userId);
  if (user) {
    const replayed = round2(evs.reduce((s, e) => s + e.delta, 0));
    const opening = round2(available(user) - replayed);
    if (opening !== 0) {
      evs.unshift({
        key: "open0",
        kind: opening > 0 ? "deposit" : "withdraw",
        title: "Opening balance",
        detail: "Carried forward",
        delta: opening,
        at: evs[0]?.at ?? user.created_at,
      });
    }
  }

  let bal = 0;
  const acts: Activity[] = evs.map((e) => {
    bal = round2(bal + e.delta);
    return { key: e.key, kind: e.kind, title: e.title, detail: e.detail, amount: e.delta, balanceAfter: bal, cash: true, at: e.at };
  });
  acts.reverse(); // newest first for display
  return acts;
}

// ---------------------------------------------------------------------------
// Admin bet activity — a cross-client log of the moments a bet is placed,
// cancelled by the client, refunded (match voided) or settled. Built from the
// bets table so it needs no extra storage; each bet contributes a "placed"
// event and, once it leaves the open state, one closing event.
// ---------------------------------------------------------------------------
export type BetEventKind = "placed" | "cancelled" | "refunded" | "won" | "lost";

export interface BetEvent {
  key: string;
  kind: BetEventKind;
  betId: number;
  username: string;
  matchTitle: string;
  selectionName: string;
  side: "A" | "B";
  stake: number;
  rate: number;
  resultPl: number;
  at: string;
}

export function listBetEvents(clientIds: number[], limit = 400): BetEvent[] {
  if (!clientIds.length) return [];

  const evs: BetEvent[] = [];
  for (const b of listBets({ userIds: clientIds })) {
    const base = {
      betId: b.id,
      username: b.username,
      matchTitle: b.match_title,
      selectionName: b.selection_name,
      side: b.selection,
      stake: b.stake,
      rate: b.rate,
    };

    evs.push({ ...base, key: `p${b.id}`, kind: "placed", resultPl: 0, at: b.placed_at });

    if (b.status === "void") {
      evs.push({
        ...base,
        key: `c${b.id}`,
        // A client cancellation carries void_reason 'cancelled'; an admin match
        // void carries 'refunded'. Anything else is treated as a refund.
        kind: b.void_reason === "cancelled" ? "cancelled" : "refunded",
        resultPl: 0,
        at: b.settled_at ?? b.placed_at,
      });
    } else if (b.status === "won" || b.status === "lost") {
      evs.push({
        ...base,
        key: `s${b.id}`,
        kind: b.status,
        resultPl: b.result_pl,
        at: b.settled_at ?? b.placed_at,
      });
    }
  }

  // Newest first, with a stable tiebreak when two events share a timestamp.
  evs.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : a.key < b.key ? 1 : -1));
  return evs.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------
export interface SettleResult {
  settledBets: number;
  winners: number;
  losers: number;
}

export function settleMarket(marketId: number, result: "A" | "B" | "void", createdBy: number): SettleResult {
  const market = getMarket(marketId);
  if (!market) throw new Error("Market not found.");
  if (market.status === "settled") throw new Error("This market is already settled.");
  const match = getMatch(market.match_id)!;

  const openBets = db
    .prepare("SELECT * FROM bets WHERE market_id = ? AND status = 'open'")
    .all(marketId) as Bet[];

  const outcome: SettleResult = { settledBets: 0, winners: 0, losers: 0 };

  const tx = db.transaction(() => {
    for (const bet of openBets) {
      const user = getUser(bet.user_id)!;
      const releasedExposure = round2(Math.max(0, user.exposure - bet.stake));

      if (result === "void") {
        db.prepare("UPDATE users SET exposure = ? WHERE id = ?").run(releasedExposure, user.id);
        db.prepare("UPDATE bets SET status = 'void', result_pl = 0, void_reason = 'refunded', settled_at = datetime('now') WHERE id = ?").run(bet.id);
        outcome.settledBets++;
        continue;
      }

      const won = bet.selection === result;
      if (won) {
        const profit = bet.potential_win;
        const newBal = round2(user.balance + profit);
        db.prepare("UPDATE users SET balance = ?, exposure = ? WHERE id = ?").run(newBal, releasedExposure, user.id);
        db.prepare("UPDATE bets SET status = 'won', result_pl = ?, settled_at = datetime('now') WHERE id = ?").run(profit, bet.id);
        writeLedger(user.id, "settle_win", profit, newBal, "market", market.id, `Won ${market.name} — ${bet.selection_name} (${match.title})`, createdBy);
        outcome.winners++;
      } else {
        const loss = bet.stake;
        const newBal = round2(user.balance - loss);
        db.prepare("UPDATE users SET balance = ?, exposure = ? WHERE id = ?").run(newBal, releasedExposure, user.id);
        db.prepare("UPDATE bets SET status = 'lost', result_pl = ?, settled_at = datetime('now') WHERE id = ?").run(-loss, bet.id);
        writeLedger(user.id, "settle_loss", -loss, newBal, "market", market.id, `Lost ${market.name} — ${bet.selection_name} (${match.title})`, createdBy);
        outcome.losers++;
      }
      outcome.settledBets++;
    }

    db.prepare("UPDATE markets SET status = 'settled', result = ?, settled_at = datetime('now') WHERE id = ?").run(result, marketId);

    // If every market of this match is settled, settle the match too.
    const openMarkets = (
      db.prepare("SELECT COUNT(*) AS n FROM markets WHERE match_id = ? AND status != 'settled'").get(match.id) as { n: number }
    ).n;
    if (openMarkets === 0) {
      db.prepare("UPDATE matches SET status = 'settled' WHERE id = ?").run(match.id);
    } else if (match.status === "upcoming") {
      db.prepare("UPDATE matches SET status = 'live' WHERE id = ?").run(match.id);
    }
  });

  tx();
  return outcome;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
export interface DownlineStat {
  user: User;
  clients: number;
  openExposure: number;
  clientPL: number; // sum of client result_pl in this subtree (client's own P&L)
}

/** Book P&L for an upline over a set of client ids = negative of clients' realised P&L. */
export function bookPnL(clientIds: number[]): number {
  if (!clientIds.length) return 0;
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(result_pl), 0) AS pl FROM bets WHERE user_id IN (${clientIds
        .map(() => "?")
        .join(",")}) AND status IN ('won','lost')`,
    )
    .get(...clientIds) as { pl: number };
  return round2(-row.pl);
}

export function totalExposure(clientIds: number[]): number {
  if (!clientIds.length) return 0;
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(exposure), 0) AS e FROM users WHERE id IN (${clientIds.map(() => "?").join(",")})`,
    )
    .get(...clientIds) as { e: number };
  return round2(row.e);
}
