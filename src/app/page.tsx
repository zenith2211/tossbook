import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isUpline } from "@/lib/auth";

export default async function Home() {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (isUpline(me.role)) redirect("/admin");
  redirect("/play");
}
