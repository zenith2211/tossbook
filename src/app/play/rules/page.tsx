import { Card, Stat } from "@/components/ui";

export const metadata = { title: "Rules & Guidelines — Toss Book" };

const CATEGORIES: { title: string; sub: string; rules: string[] }[] = [
  {
    title: "Placing Toss Picks",
    sub: "How betting works",
    rules: [
      "Minimum bet on any toss market is ₹100.",
      "The standard toss rate is 95 paisa on the rupee — a winning ₹100 bet returns ₹195 (₹95 profit).",
      "Your stake is held as exposure the moment a bet is placed and released when the market is settled.",
      "Once a market is closed or suspended, no new bets can be placed on it.",
    ],
  },
  {
    title: "Toss & Settlement",
    sub: "Outcomes and payouts",
    rules: [
      "A toss market is settled only after the official toss result is confirmed.",
      "International and top-tier league tosses are settled within about 10 minutes; domestic tosses may take up to an hour.",
      "If a match is abandoned or the toss does not take place, the market is voided and all stakes are returned.",
      "Settlement is final. Winnings are credited to your balance automatically.",
    ],
  },
  {
    title: "Deposits & Withdrawals",
    sub: "Managing your balance",
    rules: [
      "Deposits and withdrawals are handled by the admin — contact them to add or withdraw funds.",
      "You can bet up to your available balance (balance minus open exposure); withdrawals are processed after settlement.",
      "Keep your login details private — the admin will never ask you for your password.",
      "Keep your own record of deposits, bets and withdrawals.",
    ],
  },
  {
    title: "Fair Play",
    sub: "Account conduct",
    rules: [
      "One person, one account. Multiple or shared accounts may be locked.",
      "Any attempt to exploit pricing errors or place bets after a result is known will be reversed.",
      "Accounts found breaking these rules may have deposits and withdrawals suspended.",
      "These rules may be updated from time to time — check back periodically.",
    ],
  },
];

export default function Rules() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold">Rules &amp; Guidelines</h1>
        <p className="text-sm text-muted">Please read before playing. These rules keep the game fair for everyone.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Min Bet" value="₹100" />
        <Stat label="Toss Rate" value="95p" />
        <Stat label="Settlement" value="~10 min" />
        <Stat label="Withdrawal" value="Daily" />
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((cat) => (
          <Card key={cat.title}>
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-sm font-bold text-ink/90">{cat.title}</h2>
              <p className="text-xs text-muted">{cat.sub}</p>
            </div>
            <ul className="divide-y divide-line">
              {cat.rules.map((rule, i) => (
                <li key={i} className="flex gap-3 px-4 py-3 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand/15 text-[11px] font-bold text-brand">
                    {i + 1}
                  </span>
                  <span className="text-ink/80">{rule}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <p className="pb-2 text-center text-[11px] text-muted/70">
        Bet responsibly. 18+ only. Rules are subject to change.
      </p>
    </div>
  );
}
