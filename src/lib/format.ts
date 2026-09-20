export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const inr = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Money amount in ₹, grouped Indian-style (₹1,00,000). */
export function money(n: number): string {
  return `₹${inr.format(round2(n ?? 0))}`;
}

/** Backwards-compatible alias — all amounts render as real ₹ money now. */
export const coins = money;

/**
 * Short ₹ amount for tight spots like the header chip, in Indian units:
 * ₹1.2 Cr, ₹3.4 L, otherwise the full grouped figure.
 */
export function moneyShort(n: number): string {
  const v = round2(n ?? 0);
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (a >= 1e7) return `${sign}₹${Number((a / 1e7).toFixed(a >= 1e8 ? 0 : 1))} Cr`;
  if (a >= 1e5) return `${sign}₹${Number((a / 1e5).toFixed(1))} L`;
  return `${sign}₹${inr.format(a)}`;
}

/** Signed ₹ amount with + / − prefix, for P&L. */
export function signed(n: number): string {
  const v = round2(n ?? 0);
  if (v > 0) return `+₹${inr.format(v)}`;
  if (v < 0) return `−₹${inr.format(Math.abs(v))}`;
  return `₹${inr.format(0)}`;
}

export function pnlClass(n: number): string {
  if (n > 0) return "text-brand";
  if (n < 0) return "text-lay";
  return "text-muted";
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function relTime(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = d - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const label =
    mins < 60
      ? `${mins}m`
      : mins < 1440
        ? `${Math.round(mins / 60)}h`
        : `${Math.round(mins / 1440)}d`;
  return diff >= 0 ? `in ${label}` : `${label} ago`;
}
