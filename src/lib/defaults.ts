/**
 * Starter password every new client account gets. The account is flagged
 * `must_change_pw`, so the client has to replace it at their first login.
 * Safe to import from client components — no database imports here.
 */
export const DEFAULT_CLIENT_PASSWORD = process.env.NEXT_PUBLIC_DEFAULT_PASSWORD || "Abcd123";
