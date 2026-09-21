import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { BRAND, BRAND_NAME } from "@/lib/brand";
import { IconTelegram, IconShield, IconBolt, IconClock } from "@/components/icons";

const TELEGRAM_USER = process.env.NEXT_PUBLIC_TELEGRAM_ADMIN || "RSTOSSBOOK01";
const TELEGRAM_URL = `https://t.me/${TELEGRAM_USER}`;

const TRUST = [
  { icon: <IconShield className="h-4 w-4" />, value: BRAND.estd.replace(/\D/g, "") || "2019", label: "Trusted since" },
  { icon: <IconClock className="h-4 w-4" />, value: "~10m", label: "Settlement" },
  { icon: <IconBolt className="h-4 w-4" />, value: "24×7", label: "Support" },
];

export default async function LoginPage() {
  const me = await getSessionUser();
  if (me) redirect("/");

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      {/* Ambient premium glows */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-purple/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Brand lockup */}
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="glow-gold grid h-20 w-20 place-items-center rounded-3xl bg-obsidian ring-2 ring-gold/50">
            <span className="font-display text-2xl font-extrabold text-gold">{BRAND.prefix}</span>
          </span>
          <h1 className="font-display mt-4 text-2xl font-extrabold tracking-tight">
            <span className="text-ink">{BRAND.prefix} </span>
            <span className="text-gradient-brand">
              {BRAND.first} {BRAND.second}
            </span>
          </h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.32em] text-muted">Toss Gaming Arena</p>
        </div>

        {/* Sign-in card */}
        <section className="grad-border card-elevated relative overflow-hidden rounded-3xl border border-line bg-panel/85 p-6 backdrop-blur-xl sm:p-7">
          <div className="relative">
            <h2 className="font-display text-xl font-extrabold text-ink">Welcome back</h2>
            <p className="mt-1 text-sm text-muted">Sign in to your account to continue.</p>

            <div className="mt-5">
              <LoginForm />
            </div>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">New here?</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-back/30 bg-back/10 px-4 py-3 text-sm font-bold text-back transition hover:bg-back/15"
            >
              <IconTelegram className="h-5 w-5" /> Contact on Telegram
            </a>
          </div>
        </section>

        {/* Trust strip */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {TRUST.map((t) => (
            <div
              key={t.label}
              className="card-shadow rounded-2xl border border-line bg-panel/70 px-2 py-3 text-center backdrop-blur-md"
            >
              <span className="mx-auto grid h-7 w-7 place-items-center rounded-lg bg-brand/12 text-brand">{t.icon}</span>
              <div className="font-display mt-1.5 text-base font-extrabold text-ink">{t.value}</div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-muted">{t.label}</div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted/80">
          {BRAND_NAME} © {new Date().getFullYear()} · Play responsibly · 18+
        </p>
      </div>
    </main>
  );
}
