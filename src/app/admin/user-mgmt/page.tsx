import { getSessionUser } from "@/lib/auth";
import { listChildren } from "@/lib/domain";
import { UserMgmt } from "@/components/admin/user-mgmt";

export const dynamic = "force-dynamic";

export default async function UserMgmtPage() {
  const me = (await getSessionUser())!;
  const users = listChildren(me.id).map((c) => ({ id: c.id, username: c.username }));
  return <UserMgmt users={users} />;
}
