import { redirect } from "next/navigation";

/** Per-user controls are inline on the Users tab now (Add / Deduct / Set / Bets / Wallet Log). */
export default function UserDetailPage() {
  redirect("/admin/users");
}
