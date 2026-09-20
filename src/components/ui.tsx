import Link from "next/link";
import { coins, signed, pnlClass } from "@/lib/format";
import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:bg-panel focus:ring-2 focus:ring-brand/20";

export const labelCls = "mb-1 block text-xs font-semibold text-muted";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`card-shadow rounded-2xl border border-line bg-panel ${className}`}>{children}</div>
  );
}

export function CardHead({ title, right, sub }: { title: ReactNode; right?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div>
        <h2 className="text-sm font-bold tracking-wide text-ink">{title}</h2>
        {sub ? <p className="text-xs text-muted">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Stat({
  label,
  value,
  accent = "",
  sub,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
  sub?: ReactNode;
}) {
  return (
    <div className="card-shadow rounded-xl border border-line bg-panel px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-lg font-extrabold tabular-nums ${accent || "text-ink"}`}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
    </div>
  );
}

export function Money({ value, chip = false }: { value: number; chip?: boolean }) {
  return <span className={`tabular-nums ${chip ? "font-semibold text-gold" : ""}`}>{coins(value)}</span>;
}

export function PnL({ value }: { value: number }) {
  return <span className={`tabular-nums font-semibold ${pnlClass(value)}`}>{signed(value)}</span>;
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "live" | "brand" | "back" | "lay" | "gold" | "danger";
}) {
  const tones: Record<string, string> = {
    muted: "bg-panel-2 text-muted border-line",
    live: "bg-lay/10 text-lay border-lay/30",
    brand: "bg-brand/10 text-brand border-brand/30",
    back: "bg-back/10 text-back border-back/30",
    lay: "bg-lay/10 text-lay border-lay/30",
    gold: "bg-gold/10 text-gold border-gold/30",
    danger: "bg-danger/10 text-danger border-danger/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-sm text-muted">
      {children}
    </div>
  );
}

export function Logo({ size = "md", light = false }: { size?: "sm" | "md" | "lg"; light?: boolean }) {
  const dim = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const text = size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`relative grid ${dim} place-items-center rounded-xl shadow-lg ${
          light ? "bg-white shadow-black/10" : "bg-gradient-to-br from-brand to-brand-2 shadow-brand/25"
        }`}
      >
        <span className={`text-lg font-black ${light ? "text-brand" : "text-white"}`}>₹</span>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-gold" />
      </div>
      <div className="leading-tight">
        <div className={`font-black tracking-tight ${text} ${light ? "text-white" : "text-ink"}`}>
          TOSS<span className={light ? "text-white/80" : "text-brand"}>BOOK</span>
        </div>
        <div className={`text-[9px] font-semibold uppercase tracking-[0.25em] ${light ? "text-white/60" : "text-muted"}`}>
          Gaming Arena
        </div>
      </div>
    </div>
  );
}

export function LinkButton({
  href,
  children,
  variant = "ghost",
}: {
  href: string;
  children: ReactNode;
  variant?: "ghost" | "brand";
}) {
  const cls =
    variant === "brand"
      ? "bg-brand text-white hover:bg-brand-2 shadow-sm shadow-brand/30"
      : "border border-line bg-panel text-ink/80 hover:border-brand/40 hover:text-ink";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${cls}`}
    >
      {children}
    </Link>
  );
}
