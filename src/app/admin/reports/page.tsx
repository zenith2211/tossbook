import { redirect } from "next/navigation";

/** Reporting now lives on the Dashboard and Bets tabs. */
export default function ReportsPage() {
  redirect("/admin");
}
