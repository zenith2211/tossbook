import { getSessionUser } from "@/lib/auth";
import { listChildren, listBetsForUser, listLedger, getMatch, shortId } from "@/lib/domain";
import { UsersBoard } from "@/components/admin/users-board";
import type { UserCardView } from "@/components/admin/user-card";

export const dynamic = "force-dynamic";

/** Ledger type codes → the wording the wallet log shows. */
const LEDGER_TITLE: Record<string, string> = {
  opening: "Opening balance",
  deposit: "Deposit",
  withdraw: "Withdraw",
  settle_win: "Bet won",
  settle_loss: "Bet lost",
  transfer_in: "Transfer in",
  transfer_out: "Transfer out",
};

export default async function UsersPage() {
  const me = (await getSessionUser())!;

  const users: UserCardView[] = listChildren(me.id).map((c) => ({
    id: c.id,
    username: c.username,
    name: c.name,
    publicId: shortId(c),
    balance: c.balance,
    exposure: c.exposure,
    locked: c.status === "locked",
    bets: listBetsForUser(c.id, 50).map((b) => ({
      id: b.id,
      matchTitle: getMatch(b.match_id)?.title ?? "—",
      selectionName: b.selection_name,
      stake: b.stake,
      rate: b.rate,
      status: b.status,
      resultPl: b.result_pl,
      placedAt: b.placed_at,
    })),
    ledger: listLedger(c.id, 50).map((l) => ({
      id: l.id,
      title: LEDGER_TITLE[l.type] ?? l.type.replace(/_/g, " "),
      amount: l.amount,
      balanceAfter: l.balance_after,
      remark: l.remark,
      at: l.created_at,
    })),
  }));

  return <UsersBoard users={users} />;
}
