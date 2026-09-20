import { getSessionUser } from "@/lib/auth";
import { listActivity } from "@/lib/domain";
import { Passbook } from "@/components/play/passbook";

export const dynamic = "force-dynamic";

export default async function Statement() {
  const me = (await getSessionUser())!;
  return <Passbook rows={listActivity(me.id, 500)} />;
}
