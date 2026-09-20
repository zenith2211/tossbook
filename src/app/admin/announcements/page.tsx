import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listAnnouncements } from "@/lib/domain";
import { AnnouncementsBoard } from "@/components/admin/announcements-board";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const me = (await getSessionUser())!;
  if (me.role !== "admin") redirect("/admin");

  const items = listAnnouncements().map((a) => ({
    id: a.id,
    text: a.text,
    active: a.active === 1,
    createdAt: a.created_at,
  }));

  return <AnnouncementsBoard items={items} />;
}
