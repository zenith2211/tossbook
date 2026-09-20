import { redirect } from "next/navigation";
import { getSessionUser, isUpline } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Logo } from "@/components/ui";
import { FirstLoginPasswordForm } from "@/components/first-login-form";
import { IconLogout, IconLock } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  // Only shown when a change is actually required; otherwise send them onward.
  if (!me.must_change_pw) redirect(isUpline(me.role) ? "/admin" : "/play");

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>
        <div className="card-shadow rounded-2xl border border-line bg-panel p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
              <IconLock className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-extrabold text-ink">Set your password</h1>
              <p className="text-xs text-muted">Choose a new password to secure your account before you continue.</p>
            </div>
          </div>

          <FirstLoginPasswordForm />
        </div>

        <form action={logoutAction} className="mt-4 text-center">
          <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
            <IconLogout className="h-3.5 w-3.5" /> Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
