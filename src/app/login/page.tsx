import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/ui";
import { IconTelegram, IconCheck } from "@/components/icons";

const TELEGRAM_USER = "RSTOSSBOOK01";
const TELEGRAM_URL = `https://t.me/${TELEGRAM_USER}`;
// Telegram can't pre-fill a person's DM directly, so use the share sheet: it
// opens with this message written; the user taps the admin and hits Send.
const CONTACT_MESSAGE = "Hey! I'd like to open a Toss Book account. Please help me get started.";
const TELEGRAM_CONTACT_URL = `https://t.me/share/url?url=${encodeURIComponent(TELEGRAM_URL)}&text=${encodeURIComponent(CONTACT_MESSAGE)}`;

const HIGHLIGHTS = [
  "Live cricket toss & match-winner markets",
  "Instant, transparent settlements",
  "Real ₹ balance with a clear statement",
  "24×7 support on Telegram",
];

export default async function LoginPage() {
  const me = await getSessionUser();
  if (me) redirect("/");

  return (
    <main className="min-h-dvh w-full lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* ---------------- Brand hero ---------------- */}
      <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0b3f3c] via-brand to-brand-2 px-6 py-8 text-white lg:px-14 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(55% 45% at 15% 0%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(45% 45% at 100% 100%, rgba(0,0,0,0.35), transparent 60%), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 76px)",
          }}
        />

        <div className="relative flex items-center justify-between">
          <Logo size="lg" light />
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur">
            Est. 2019
          </span>
        </div>

        <div className="relative my-8 lg:my-0">
          <h1 className="max-w-md text-3xl font-black leading-tight tracking-tight lg:text-[2.6rem]">
            Back the toss.<br className="hidden lg:block" /> Win instantly.
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/80 lg:text-base">
            The original live cricket toss gaming arena — fast markets, clean settlements, real balance.
          </p>

          <ul className="mt-6 hidden space-y-2.5 lg:block">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-3 text-sm text-white/90">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15">
                  <IconCheck className="h-3 w-3" />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden items-center gap-6 text-white/80 lg:flex">
          <div>
            <div className="text-2xl font-black text-white">2019</div>
            <div className="text-[11px] uppercase tracking-wider text-white/60">Trusted since</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <div className="text-2xl font-black text-white">~10m</div>
            <div className="text-[11px] uppercase tracking-wider text-white/60">Settlement</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <div className="text-2xl font-black text-white">24×7</div>
            <div className="text-[11px] uppercase tracking-wider text-white/60">Support</div>
          </div>
        </div>
      </section>

      {/* ---------------- Sign-in ---------------- */}
      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-ink">Sign in</h2>
            <p className="mt-1 text-sm text-muted">Welcome back — access your account to continue.</p>
          </div>

          <LoginForm />

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">New to Toss Book?</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <a
            href={TELEGRAM_CONTACT_URL}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-3 text-sm font-bold text-white shadow-sm shadow-[#229ED9]/30 transition hover:brightness-105"
          >
            <IconTelegram className="h-5 w-5" /> Contact on Telegram
          </a>

          <p className="mt-8 text-center text-[11px] text-muted/80">
            Toss Book © 2026 · Play responsibly · 18+
          </p>
        </div>
      </section>
    </main>
  );
}
