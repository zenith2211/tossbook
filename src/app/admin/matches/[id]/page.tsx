import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getMatch, listMarkets, listBets } from "@/lib/domain";
import { setMatchStatusAction } from "@/lib/actions/admin-actions";
import { Card, CardHead, Badge, Empty, PnL } from "@/components/ui";
import { MarketEditForm, DeclareResultForm } from "@/components/match-admin-forms";
import { coins, fmtDateTime } from "@/lib/format";
import { IconBack } from "@/components/icons";

export const dynamic = "force-dynamic";

const STATUS_ACTIONS: { status: "upcoming" | "live" | "closed"; label: string }[] = [
  { status: "upcoming", label: "Upcoming" },
  { status: "live", label: "Go Live" },
  { status: "closed", label: "Close" },
];

export default async function MatchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = (await getSessionUser())!;
  if (me.role !== "admin") redirect("/admin");

  const match = getMatch(Number(id));
  if (!match) notFound();
  const markets = listMarkets(match.id).filter((m) => m.type === "toss");
  const bets = listBets({ matchId: match.id });

  return (
    <div className="space-y-5">
      <Link href="/admin/matches" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <IconBack className="h-4 w-4" /> Matches
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            {match.title}
            {match.status === "live" ? (
              <Badge tone="live">LIVE</Badge>
            ) : match.status === "settled" ? (
              <Badge tone="brand">Settled</Badge>
            ) : (
              <Badge tone="muted">{match.status}</Badge>
            )}
          </h1>
          <p className="text-sm text-muted">{match.league} · {fmtDateTime(match.start_time)}</p>
        </div>
        {match.status !== "settled" && (
          <div className="flex gap-2">
            {STATUS_ACTIONS.map((s) => (
              <form action={setMatchStatusAction} key={s.status}>
                <input type="hidden" name="matchId" value={match.id} />
                <input type="hidden" name="status" value={s.status} />
                <button
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    match.status === s.status
                      ? "border-brand bg-brand/15 text-brand"
                      : "border-line text-muted hover:text-ink"
                  }`}
                >
                  {s.label}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {markets.map((mk) => (
          <Card key={mk.id}>
            <CardHead
              title={mk.name}
              right={
                mk.status === "settled" ? (
                  <Badge tone="brand">
                    Result: {mk.result === "A" ? match.team_a : mk.result === "B" ? match.team_b : "Void"}
                  </Badge>
                ) : (
                  <Badge tone={mk.status === "open" ? "back" : "danger"}>{mk.status}</Badge>
                )
              }
            />
            <div className="space-y-4 p-4">
              {mk.status !== "settled" ? (
                <>
                  <MarketEditForm market={mk} />
                  <div className="rounded-xl border border-danger/20 bg-danger/5 p-3">
                    <DeclareResultForm marketId={mk.id} teamA={match.team_a} teamB={match.team_b} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">
                  This market has been settled. Winner:{" "}
                  <span className="font-semibold text-brand">
                    {mk.result === "A" ? match.team_a : mk.result === "B" ? match.team_b : "Void"}
                  </span>
                  .
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHead title="Bets on this match" right={<Badge tone="muted">{bets.length}</Badge>} />
        {bets.length === 0 ? (
          <Empty>No bets placed on this match yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Market</th>
                  <th className="px-4 py-2">Selection</th>
                  <th className="px-4 py-2 text-right">Stake</th>
                  <th className="px-4 py-2 text-right">Rate</th>
                  <th className="px-4 py-2 text-right">Status / P&L</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((b) => (
                  <tr key={b.id} className="border-b border-line/60">
                    <td className="px-4 py-2 font-medium">@{b.username}</td>
                    <td className="px-4 py-2 text-muted">{b.market_type === "toss" ? "Toss" : "Match"}</td>
                    <td className="px-4 py-2">{b.selection_name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{coins(b.stake)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{b.rate.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      {b.status === "open" ? <Badge tone="gold">Open</Badge> : <PnL value={b.result_pl} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
