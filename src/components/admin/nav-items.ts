/**
 * Admin section list, shared by the server layout (drawer menu) and the client
 * tab bar. Kept free of "use client" so the server can actually read it —
 * importing a plain value out of a client module yields a proxy, not the array.
 */
export interface AdminTab {
  key: "dashboard" | "matches" | "users" | "bets" | "user-mgmt" | "announcements";
  href: string;
  label: string;
  exact?: boolean;
}

export const ADMIN_TABS: AdminTab[] = [
  { key: "dashboard", href: "/admin", label: "Dashboard", exact: true },
  { key: "matches", href: "/admin/matches", label: "Matches" },
  { key: "users", href: "/admin/users", label: "Users" },
  { key: "bets", href: "/admin/bets", label: "Bets" },
  { key: "user-mgmt", href: "/admin/user-mgmt", label: "User Mgmt" },
  { key: "announcements", href: "/admin/announcements", label: "Announcements" },
];
