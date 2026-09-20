import type { Announcement } from "@/lib/types";
import { IconInfo, IconMegaphone } from "@/components/icons";

/**
 * Scrolling announcement strip under the header. The track holds the list
 * twice and shifts by exactly half its width, so the loop is seamless.
 */
export function Ticker({ items }: { items: Announcement[] }) {
  if (!items.length) return null;

  const totalChars = items.reduce((n, a) => n + a.text.length, 0);
  const duration = Math.max(18, Math.min(70, Math.round(totalChars / 3.2)));
  const run = [...items, ...items];

  return (
    <div className="ticker-viewport relative overflow-hidden bg-gradient-to-r from-[#2b3648] via-[#333f55] to-[#2b3648] text-white/90">
      <span className="absolute left-0 top-0 z-10 grid h-full w-9 place-items-center bg-[#2b3648] text-white/70 shadow-[6px_0_10px_rgba(43,54,72,0.9)]">
        <IconMegaphone className="h-4 w-4" />
      </span>
      <div
        className="ticker-track py-2 pl-11"
        style={{ ["--ticker-duration" as string]: `${duration}s` }}
        aria-hidden
      >
        {run.map((a, i) => (
          <span key={`${a.id}-${i}`} className="flex items-center gap-2 pr-10 text-[12px] font-bold uppercase tracking-wider">
            <IconInfo className="h-3.5 w-3.5 shrink-0 text-white/50" />
            {a.text}
            <span className="pl-8 text-white/25">|</span>
          </span>
        ))}
      </div>
      {/* Screen readers get the list once, un-animated. */}
      <ul className="sr-only">
        {items.map((a) => (
          <li key={a.id}>{a.text}</li>
        ))}
      </ul>
    </div>
  );
}
