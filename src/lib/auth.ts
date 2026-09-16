import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import type { SafeUser, User, Role } from "./types";
import { ROLE_RANK } from "./types";

const COOKIE = "tb_session";
const SESSION_DAYS = 7;

function stripPassword(u: User): SafeUser {
  const { password: _pw, ...rest } = u;
  void _pw;
  return rest;
}

export async function createSession(userId: number): Promise<void> {
  const id = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  db.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(id, userId, expires.toISOString());

  const store = await cookies();
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const id = store.get(COOKIE)?.value;
  if (id) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
    store.delete(COOKIE);
  }
}

export async function getSessionUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const id = store.get(COOKIE)?.value;
  if (!id) return null;

  const row = db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > datetime('now')`,
    )
    .get(id) as User | undefined;

  if (!row) return null;
  if (row.status === "locked") return null;
  return stripPassword(row);
}

export function isUpline(role: Role): boolean {
  return role === "admin";
}

export function canManage(actor: SafeUser, targetRole: Role): boolean {
  return ROLE_RANK[actor.role] > ROLE_RANK[targetRole];
}

/** Collect the id set of a user's entire downline (inclusive of self). */
export function downlineIds(rootId: number): number[] {
  const ids: number[] = [rootId];
  const queue = [rootId];
  const childStmt = db.prepare("SELECT id FROM users WHERE parent_id = ?");
  while (queue.length) {
    const parent = queue.shift()!;
    const kids = childStmt.all(parent) as { id: number }[];
    for (const k of kids) {
      ids.push(k.id);
      queue.push(k.id);
    }
  }
  return ids;
}

/** True if `targetId` is anywhere in `actorId`'s downline (or is the actor). */
export function isAncestorOf(actorId: number, targetId: number): boolean {
  let cur = db.prepare("SELECT id, parent_id FROM users WHERE id = ?").get(targetId) as
    | { id: number; parent_id: number | null }
    | undefined;
  while (cur) {
    if (cur.id === actorId) return true;
    if (cur.parent_id == null) break;
    cur = db.prepare("SELECT id, parent_id FROM users WHERE id = ?").get(cur.parent_id) as
      | { id: number; parent_id: number | null }
      | undefined;
  }
  return false;
}
