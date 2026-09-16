import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listMatches, listMarkets } from "@/lib/domain";
import { db } from "@/lib/db";
import { Card, CardHead, Badge, Empty } from "@/components/ui";
import { CreateMatchButton } from "@/components/match-admin-forms";
import { fmtDateTime } from "@/lib/format";
import { IconBack } from "@/components/icons";

export const dynamic = "force-dynamic";

function openBetsForMatch(matchId: number): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM bets WHERE match_id = ? AND status='open'").get(matchId) as { n: number }).n;
}

export default async function MatchesPage() {
  const me = (await getSessionUser())!;
  if (me.role !== "admin") redirect("/admin");

  const matches = listMatches();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Matches</h1>
          <p className="text-sm text-muted">Create matches, set rates &amp; declare results.</p>
        </div>
        <CreateMatchButton />
      </div>

      <Card>
        <CardHead title="All Matches" right={<Badge tone="muted">{matches.length}</Badge>} />
        {matches.length === 0 ? (
          <Empty>No matches yet. Create your first match to open a market.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {matches.map((m) => {
              const markets = listMarkets(m.id);
              const openMk = markets.filter((mk) => mk.status !== "settled").length;
              const open = openBetsForMatch(m.id);
              return (
                <li key={m.id}>
                  <Link href={`/admin/matches/${m.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-ink/5">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {m.title}
                        {m.status === "live" ? (
                          <Badge tone="live">LIVE</Badge>
                        ) : m.status === "settled" ? (
                          <Badge tone="brand">Settled</Badge>
                        ) : m.status === "closed" ? (
                          <Badge tone="danger">Closed</Badge>
                        ) : (
                          <Badge tone="muted">Upcoming</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted">
                        {m.league} · {fmtDateTime(m.start_time)} · {openMk} open market(s)
                        {open > 0 ? ` · ${open} open bet(s)` : ""}
                      </div>
                    </div>
                    <span className="grid h-8 w-8 rotate-180 place-items-center rounded-lg border border-line text-muted">
                      <IconBack className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
