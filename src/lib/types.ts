export type Role = "admin" | "client";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  client: "Client",
};

// Who each role is allowed to create beneath them.
export const CHILD_ROLE: Record<Role, Role | null> = {
  admin: "client",
  client: null,
};

export const ROLE_RANK: Record<Role, number> = {
  admin: 1,
  client: 0,
};

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: Role;
  parent_id: number | null;
  balance: number;
  exposure: number;
  credit_limit: number;
  share_pct: number;
  commission_pct: number;
  status: "active" | "locked";
  must_change_pw: number;
  created_at: string;
  updated_at: string;
}

export type SafeUser = Omit<User, "password">;

export interface Match {
  id: number;
  title: string;
  team_a: string;
  team_b: string;
  league: string;
  start_time: string;
  end_time: string | null;
  image_url: string | null;
  status: "upcoming" | "live" | "closed" | "settled";
  created_by: number | null;
  created_at: string;
}

export interface Market {
  id: number;
  match_id: number;
  type: "toss" | "match_winner";
  name: string;
  status: "open" | "suspended" | "closed" | "settled";
  rate_a: number;
  rate_b: number;
  min_stake: number;
  max_stake: number;
  result: "A" | "B" | "void" | null;
  created_at: string;
  settled_at: string | null;
}

export interface Bet {
  id: number;
  user_id: number;
  match_id: number;
  market_id: number;
  market_type: "toss" | "match_winner";
  selection: "A" | "B";
  selection_name: string;
  stake: number;
  rate: number;
  potential_win: number;
  status: "open" | "won" | "lost" | "void";
  result_pl: number;
  placed_at: string;
  settled_at: string | null;
}

export interface Request {
  id: number;
  user_id: number;
  parent_id: number | null;
  type: "deposit" | "withdraw";
  amount: number;
  method: string;
  note: string;
  status: "pending" | "approved" | "rejected";
  decided_by: number | null;
  decided_at: string | null;
  created_at: string;
}

export interface LedgerEntry {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  balance_after: number;
  ref_type: string | null;
  ref_id: number | null;
  remark: string;
  created_by: number | null;
  created_at: string;
}
