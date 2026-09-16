import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { available, bookPnL, totalExposure, listChildren } from "@/lib/domain";
import { Stat, Card, CardHead, PnL, LinkButton } from "@/components/ui";
import { coins } from "@/lib/format";
import { IconPlus, IconCricket } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const me = (await getSessionUser())!;
  const clients = listChildren(me.id);
  const clientIds = clients.map((c) => c.id);

  const pl = bookPnL(clientIds);
  const exposure = totalExposure(clientIds);
  const openBets = clientIds.length
    ? (db
        .prepare(
          `SELECT COUNT(*) AS n FROM bets WHERE status='open' AND user_id IN (${clientIds.map(() => "?").join(",")})`,
        )
        .get(...clientIds) as { n: number }).n
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted">Overview of your book.</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <LinkButton href="/admin/users" variant="brand">
            <IconPlus className="h-4 w-4" /> Clients
          </LinkButton>
          <LinkButton href="/admin/matches">
            <IconCricket className="h-4 w-4" /> Matches
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="My Balance" value={coins(available(me))} accent="text-gold" />
        <Stat label="Book P&L" value={<PnL value={pl} />} sub="From client results" />
        <Stat label="Live Exposure" value={coins(exposure)} accent={exposure > 0 ? "text-lay" : ""} />
        <Stat label="Open Bets" value={openBets} />
      </div>

      <Card>
        <CardHead
          title={`Clients (${clients.length})`}
          right={<LinkButton href="/admin/users">Manage →</LinkButton>}
        />
        {clients.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted">
            No clients yet. Add your first client from{" "}
            <Link href="/admin/users" className="text-brand underline">
              Clients
            </Link>
            .
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/users/${c.id}`}
                  className="flex items-center justify-between px-4 py-3 transition hover:bg-ink/5"
                >
                  <div>
                    <div className="text-sm font-semibold">
                      {c.name} <span className="text-xs font-normal text-muted">@{c.username}</span>
                    </div>
                    <div className="text-xs text-muted">{c.status === "locked" ? "🔒 Locked" : "Active"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gold">{coins(c.balance)}</div>
                    {c.exposure > 0 ? <div className="text-xs text-lay">Exp {coins(c.exposure)}</div> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
