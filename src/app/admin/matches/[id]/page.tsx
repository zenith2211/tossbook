import { redirect } from "next/navigation";

/** Per-match controls are inline on the Matches tab now (Edit / results / P&L / bets). */
export default function MatchDetailPage() {
  redirect("/admin/matches");
}
