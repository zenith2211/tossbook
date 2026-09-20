import type { MatchPhase } from "@/lib/types";

/** One bet as the admin match card lists it under "View Bets". */
export interface MatchBetView {
  id: number;
  username: string;
  side: "A" | "B";
  selectionName: string;
  stake: number;
  rate: number;
  status: "open" | "won" | "lost" | "void";
  resultPl: number;
  placedAt: string;
}

/**
 * Everything one admin match card renders. Built on the server so the client
 * component stays a pure view and no database types cross the boundary.
 */
export interface MatchCardView {
  id: number;
  title: string;
  league: string;
  teamA: string;
  teamB: string;
  startTime: string;
  liveTime: string | null;
  endTime: string | null;
  imageUrl: string | null;
  phase: MatchPhase;
  winner: string | null;
  settled: boolean;
  rateA: number;
  rateB: number;
  maxStake: number;
  minStake: number;
  betsA: number;
  betsB: number;
  stakeA: number;
  stakeB: number;
  payoutA: number;
  payoutB: number;
  houseIfA: number;
  houseIfB: number;
  totalBets: number;
  totalStake: number;
  bets: MatchBetView[];
}

export const PHASE_TONE: Record<MatchPhase, { chip: string; dot: string; label: string }> = {
  pending: { chip: "border-line bg-panel-2 text-muted", dot: "text-muted", label: "PENDING" },
  upcoming: { chip: "border-back/30 bg-back/10 text-back", dot: "text-back", label: "UPCOMING" },
  live: { chip: "border-lay/35 bg-lay/10 text-lay", dot: "text-lay", label: "LIVE" },
  closed: { chip: "border-line bg-panel-2 text-muted", dot: "text-muted", label: "CLOSED" },
  cancelled: { chip: "border-purple/30 bg-purple/10 text-purple", dot: "text-purple", label: "CANCELLED" },
};

export const PHASE_ORDER: MatchPhase[] = ["pending", "upcoming", "live", "closed", "cancelled"];
