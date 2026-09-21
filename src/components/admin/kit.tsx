import type { ReactNode } from "react";

/* Shared building blocks for the admin console. Everything here reads colours
   from the CSS variables, so the whole kit repaints with `.theme-light`. */

// --- Surfaces -------------------------------------------------------------
export function Panel({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`card-shadow rounded-2xl border border-line bg-panel ${padded ? "p-4 sm:p-5" : ""} ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({
  icon,
  title,
  sub,
  right,
}: {
  icon?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon ? <span className="text-brand">{icon}</span> : null}
        <div>
          <h2 className="font-display text-lg font-bold leading-tight text-ink">{title}</h2>
          {sub ? <p className="text-xs text-muted">{sub}</p> : null}
        </div>
      </div>
      {right}
    </div>
  );
}

/** Small rounded square holding a glyph, used beside section titles. */
export function IconTile({ children, tone = "brand" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`hairline-top grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${TONE_SOFT[tone]}`}>
      {children}
    </span>
  );
}

// --- Tones ----------------------------------------------------------------
export type Tone = "brand" | "gold" | "lay" | "back" | "purple" | "muted" | "green";

export const TONE_SOFT: Record<Tone, string> = {
  brand: "border-brand/25 bg-brand/10 text-brand",
  gold: "border-gold/30 bg-gold/10 text-gold",
  lay: "border-lay/30 bg-lay/10 text-lay",
  back: "border-back/30 bg-back/10 text-back",
  purple: "border-purple/30 bg-purple/10 text-purple",
  muted: "border-line bg-panel-2 text-muted",
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
};

export function Chip({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TONE_SOFT[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// --- Buttons --------------------------------------------------------------
export type BtnTone = "primary" | "neutral" | "gold" | "green" | "red" | "blue" | "purple" | "ghost";

export const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

export const BTN: Record<BtnTone, string> = {
  primary: "bg-teal-cta text-white glow-brand sheen hover:brightness-110 active:brightness-95",
  neutral: "border border-line bg-panel text-ink/75 hover:border-brand/35 hover:text-brand hover:bg-panel-2/60",
  gold: "border border-gold/40 bg-gold/5 text-gold hover:bg-gold/10",
  green: "border border-emerald-500/35 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10",
  red: "border border-lay/40 bg-lay/5 text-lay hover:bg-lay/10",
  blue: "border border-back/35 bg-back/5 text-back hover:bg-back/10",
  purple: "border border-purple/35 bg-purple/5 text-purple hover:bg-purple/10",
  ghost: "text-muted hover:text-ink",
};

export function btnCls(tone: BtnTone = "neutral", extra = ""): string {
  return `${BTN_BASE} ${BTN[tone]} ${extra}`;
}

// --- Form fields ----------------------------------------------------------
export const fieldCls =
  "w-full rounded-xl border border-transparent bg-panel-2 px-3.5 py-3 text-sm font-medium text-ink outline-none inset-soft transition placeholder:font-normal placeholder:text-muted/80 focus:border-brand/40 focus:bg-panel focus:ring-4 focus:ring-brand/10";

export const fieldLabelCls =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-muted";

/**
 * Native `<select>` styled like the text inputs. The browser's own arrow is
 * removed and replaced with a chevron drawn at a fixed size, so it matches the
 * chevrons on the buttons rather than scaling with the font.
 */
export const selectCls = `${fieldCls} appearance-none pr-10`;

export const selectStyle: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237d90a6' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  backgroundSize: "16px 16px",
};

export function FormField({
  label,
  optional,
  required,
  hint,
  children,
}: {
  label: string;
  optional?: boolean;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={fieldLabelCls}>
        {label}
        {required ? <span className="ml-0.5 text-lay">*</span> : null}
        {optional ? <span className="ml-1 font-medium normal-case tracking-normal text-muted/70">(optional)</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

// --- Stats ----------------------------------------------------------------
export function StatTile({
  label,
  value,
  tone = "ink",
  sub,
}: {
  label: string;
  value: ReactNode;
  tone?: "ink" | "gold" | "brand" | "lay" | "back";
  sub?: ReactNode;
}) {
  const colour =
    tone === "gold" ? "text-gold" : tone === "brand" ? "text-brand" : tone === "lay" ? "text-lay" : tone === "back" ? "text-back" : "text-ink";
  return (
    <div className="card-shadow grad-border relative overflow-hidden rounded-2xl border border-line bg-panel px-4 py-3.5 text-center">
      <div className="relative text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{label}</div>
      <div className={`font-display relative mt-1 whitespace-nowrap text-xl font-extrabold tabular-nums sm:text-2xl ${colour}`}>
        {value}
      </div>
      {sub ? <div className="relative mt-0.5 text-[11px] text-muted">{sub}</div> : null}
    </div>
  );
}

// --- States ---------------------------------------------------------------
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-panel-2/50 px-6 py-10 text-center">
      {icon ? <span className="text-muted/60">{icon}</span> : null}
      <p className="font-display text-base font-bold text-ink">{title}</p>
      {hint ? <p className="max-w-sm text-xs text-muted">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card-shadow rounded-2xl border border-line bg-panel p-4">
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="skeleton mt-2.5 h-5 w-52 rounded-full" />
          <div className="skeleton mt-3 h-3 w-full rounded-full" />
          <div className="mt-3 flex gap-2">
            <div className="skeleton h-8 w-20 rounded-xl" />
            <div className="skeleton h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Avatar circle showing the first letter of a username. */
export function Avatar({ name, className = "h-10 w-10" }: { name: string; className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand/15 to-purple/15 font-display text-base font-bold uppercase text-brand ring-1 ring-inset ring-line ${className}`}
    >
      {name.trim().charAt(0) || "?"}
    </span>
  );
}
