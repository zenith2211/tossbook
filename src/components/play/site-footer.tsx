import { BRAND, BRAND_NAME } from "@/lib/brand";
import { IconWhatsApp, IconTelegram } from "@/components/icons";

const WA = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || "";
const TG = process.env.NEXT_PUBLIC_TELEGRAM_ADMIN || "RSTOSSBOOK01";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-line px-4 py-8 text-center">
      <div className="flex items-center justify-center gap-2.5">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#26354a] to-[#0f1825] ring-2 ring-gold/40">
          <span className="font-display text-sm font-extrabold text-gold">{BRAND.prefix}</span>
        </span>
        <span className="font-display text-lg font-extrabold tracking-tight">
          <span className="text-ink">{BRAND.prefix} </span>
          <span className="text-brand">
            {BRAND.first} {BRAND.second}
          </span>
        </span>
      </div>

      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
        {BRAND.estd} · The original brand
      </p>
      <p className="mx-auto mt-2 max-w-xs text-[13px] text-muted">
        The original and trusted cricket toss gaming arena.
      </p>

      <a
        href={WA ? `https://wa.me/${WA}` : `https://t.me/${TG}`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-2 text-[13px] font-bold text-ink/75 transition hover:border-brand/40 hover:text-brand"
      >
        {WA ? <IconWhatsApp className="h-4 w-4" /> : <IconTelegram className="h-4 w-4" />}
        {WA ? "Contact via WhatsApp" : `Contact @${TG}`}
      </a>

      <p className="mt-4 text-[11px] text-muted">
        {BRAND_NAME} © {new Date().getFullYear()} · Play responsibly · 18+
      </p>
    </footer>
  );
}
