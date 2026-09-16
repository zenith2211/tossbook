"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/db";
import { getUserByUsername, getUser, setPassword } from "@/lib/domain";
import { createSession, destroySession, getSessionUser } from "@/lib/auth";
import { type ActionResult, OK, FAIL } from "@/lib/action-result";

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return FAIL("Enter your username and password.");

  const user = getUserByUsername(username);
  if (!user || !verifyPassword(password, user.password)) {
    return FAIL("Invalid username or password.");
  }
  if (user.status === "locked") {
    return FAIL("This account is locked. Contact the admin.");
  }

  await createSession(user.id);
  return OK();
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await getSessionUser();
  if (!me) return FAIL("Session expired. Please sign in again.");

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const full = getUser(me.id);
  if (!full) return FAIL("Account not found.");
  if (!verifyPassword(current, full.password)) return FAIL("Current password is incorrect.");
  if (next.length < 6) return FAIL("New password must be at least 6 characters.");
  if (next !== confirm) return FAIL("New password and confirmation do not match.");

  setPassword(me.id, next);
  return OK("Password updated.");
}
