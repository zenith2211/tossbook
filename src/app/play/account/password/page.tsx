import Link from "next/link";
import { ChangePasswordCard } from "@/components/admin/change-password-card";
import { IconBack } from "@/components/icons";

export const dynamic = "force-dynamic";

export default function ChangePasswordPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/play/account"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted transition hover:text-ink"
      >
        <IconBack className="h-4 w-4" /> Profile
      </Link>

      <ChangePasswordCard />
    </div>
  );
}
