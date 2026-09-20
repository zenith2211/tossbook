import { BRAND } from "@/lib/brand";

/** Header lockup: monogram disc + wordmark + established line. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#26354a] to-[#0f1825] shadow-md shadow-black/20 ring-2 ring-gold/40 sm:h-10 sm:w-10">
        <span className="font-display text-[13px] font-extrabold tracking-tight text-gold sm:text-sm">{BRAND.prefix}</span>
      </span>
      <span className="leading-none">
        <span className="font-display block whitespace-nowrap text-[15px] font-extrabold tracking-tight sm:text-[17px]">
          <span className="text-ink">{BRAND.prefix} </span>
          <span className="text-ink">{BRAND.first} </span>
          <span className="text-brand">{BRAND.second}</span>
        </span>
        {compact ? null : (
          <span className="mt-1 block whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.22em] text-muted">
            {BRAND.estd}
          </span>
        )}
      </span>
    </div>
  );
}
