import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser, isAncestorOf } from "@/lib/auth";
import { getUser, available, listLedger, listBetsForUser } from "@/lib/domain";
import { toggleStatusAction } from "@/lib/actions/admin-actions";
import { Card, CardHead, Stat, Badge, Empty, PnL } from "@/components/ui";
import {
  TransferButton,
  EditSettingsForm,
  ResetPasswordForm,
} from "@/components/admin-forms";
import { coins, signed, pnlClass, fmtDateTime } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/types";
import { IconBack } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = (await getSessionUser())!;
  const userId = Number(id);
  const u = getUser(userId);

  if (!u || userId === me.id || !isAncestorOf(me.id, userId)) notFound();

  const isDirect = u.parent_id === me.id;
  const ledger = listLedger(u.id, 60);
  const bets = u.role === "client" ? listBetsForUser(u.id, 60) : [];

  return (
    <div className="space-y-5">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <IconBack className="h-4 w-4" /> Clients
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-lg font-black text-ink">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
              {u.name}
              <Badge tone={u.role === "client" ? "back" : "brand"}>{ROLE_LABEL[u.role]}</Badge>
              {u.status === "locked" ? <Badge tone="danger">Locked</Badge> : <Badge tone="brand">Active</Badge>}
            </div>
            <div className="text-xs text-muted">@{u.username}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDirect && <TransferButton childId={u.id} childUsername={u.username} />}
          <form action={toggleStatusAction}>
            <input type="hidden" name="childId" value={u.id} />
            <button
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                u.status === "active"
                  ? "border-danger/30 text-danger hover:bg-danger/10"
                  : "border-brand/30 text-brand hover:bg-brand/10"
              }`}
            >
              {u.status === "active" ? "Lock" : "Unlock"}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Balance" value={coins(u.balance)} accent="text-gold" />
        <Stat label="Available" value={coins(available(u))} />
        <Stat label="Exposure" value={coins(u.exposure)} accent={u.exposure > 0 ? "text-lay" : ""} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title="Settings" />
          <EditSettingsForm childId={u.id} defaults={{ name: u.name }} />
          <div className="border-t border-line">
            <ResetPasswordForm childId={u.id} />
          </div>
        </Card>

        {u.role === "client" && (
          <Card>
            <CardHead title="Recent Bets" right={<Badge tone="muted">{bets.length}</Badge>} />
            {bets.length === 0 ? (
              <Empty>No bets placed yet.</Empty>
            ) : (
              <ul className="max-h-96 divide-y divide-line overflow-y-auto">
                {bets.map((b) => (
                  <li key={b.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <div className="text-sm font-medium">{b.selection_name}</div>
                      <div className="text-xs text-muted">
                        {b.market_type === "toss" ? "Toss" : "Match"} · {coins(b.stake)} @ {b.rate.toFixed(2)}
                      </div>
                    </div>
                    {b.status === "open" ? (
                      <Badge tone="gold">Open</Badge>
                    ) : (
                      <PnL value={b.result_pl} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      <Card>
        <CardHead title="Ledger" sub="All transactions on this account" />
        {ledger.length === 0 ? (
          <Empty>No transactions yet.</Empty>
        ) : (
          <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto">
            {ledger.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium capitalize">{r.type.replace(/_/g, " ")}</div>
                  <div className="truncate text-xs text-muted">{r.remark || fmtDateTime(r.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold tabular-nums ${pnlClass(r.amount)}`}>{signed(r.amount)}</div>
                  <div className="text-xs text-muted">Bal {coins(r.balance_after)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
