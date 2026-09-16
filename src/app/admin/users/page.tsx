import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listChildren } from "@/lib/domain";
import { Card, CardHead, Empty, Badge } from "@/components/ui";
import { CreateAccountButton, TransferButton } from "@/components/admin-forms";
import { coins } from "@/lib/format";
import { CHILD_ROLE, ROLE_LABEL } from "@/lib/types";
import { IconBack } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = (await getSessionUser())!;
  const childRole = CHILD_ROLE[me.role];
  const children = listChildren(me.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Clients</h1>
          <p className="text-sm text-muted">Your clients &amp; their balances.</p>
        </div>
        {childRole && <CreateAccountButton childRoleLabel={ROLE_LABEL[childRole]} />}
      </div>

      <Card>
        <CardHead
          title="All Clients"
          right={<Badge tone="muted">{children.length} client(s)</Badge>}
        />
        {children.length === 0 ? (
          <Empty>No clients yet. Add your first client using the button above.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {children.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/admin/users/${c.id}`} className="flex flex-1 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="truncate">{c.name}</span>
                      {c.status === "locked" ? <Badge tone="danger">Locked</Badge> : null}
                    </div>
                    <div className="text-xs text-muted">@{c.username}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gold">{coins(c.balance)}</div>
                    {c.exposure > 0 ? <div className="text-xs text-lay">Exp {coins(c.exposure)}</div> : null}
                  </div>
                </Link>
                <TransferButton childId={c.id} childUsername={c.username} compact />
                <Link
                  href={`/admin/users/${c.id}`}
                  className="grid h-8 w-8 rotate-180 place-items-center rounded-lg border border-line text-muted hover:text-ink"
                  aria-label="Open"
                >
                  <IconBack className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
