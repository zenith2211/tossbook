import { getSessionUser } from "@/lib/auth";
import { listBets } from "@/lib/domain";
import { BetsList } from "@/components/bets-list";

export const dynamic = "force-dynamic";

export default async function MyBets() {
  const me = (await getSessionUser())!;
  const bets = listBets({ userIds: [me.id] });

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold">My Bets</h1>
      <BetsList bets={bets} />
    </div>
  );
}
