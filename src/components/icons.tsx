type IconProps = { className?: string };
const base = "h-5 w-5";

export function IconHome({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
export function IconTicket({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
      <path d="M15 6v12" strokeDasharray="2 2" />
    </svg>
  );
}
export function IconLedger({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4h16v16H4z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}
export function IconUser({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  );
}
export function IconUsers({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.3 2.9-5 6.5-5s6.5 1.7 6.5 5" />
      <path d="M16 5.2A3 3 0 0 1 16 11M17.5 20c0-2.4-.8-4-2-5" />
    </svg>
  );
}
export function IconCricket({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 3.5 20 9 9.5 19.5 4 14z" />
      <circle cx="6.5" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M13 5 19 11" />
    </svg>
  );
}
export function IconChart({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </svg>
  );
}
export function IconCash({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9v6M18 9v6" />
    </svg>
  );
}
export function IconLogout({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5M5 12h11" />
    </svg>
  );
}
export function IconPlus({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function IconTrophy({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M9 20h6M12 13v4" />
    </svg>
  );
}
export function IconInbox({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 13h4l2 3h4l2-3h4" />
      <path d="M5 6h14l2 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z" />
    </svg>
  );
}
export function IconBook({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M9 3v14" />
    </svg>
  );
}
export function IconLock({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
export function IconEye({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
export function IconEyeOff({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3l18 18M10.6 10.7a3 3 0 0 0 4 4" />
      <path d="M9.9 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.7A17 17 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 3.4-.6" />
    </svg>
  );
}
export function IconShield({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}
export function IconBolt({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  );
}
export function IconWhatsApp({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.16L2 22l4.95-1.3A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 0 1 6.86 12.4l-.2.32.6 2.2-2.26-.6-.3.18a8.1 8.1 0 1 1-4.7-14.7Zm-3 4.02c-.15 0-.4.06-.6.28-.2.22-.78.76-.78 1.85 0 1.1.8 2.16.9 2.3.12.15 1.57 2.5 3.9 3.4 1.94.77 2.33.62 2.75.58.42-.04 1.35-.55 1.55-1.09.2-.53.2-.99.14-1.08-.06-.1-.22-.15-.46-.27-.24-.12-1.35-.67-1.56-.74-.2-.08-.35-.12-.5.11-.14.23-.57.74-.7.88-.13.15-.26.16-.5.05-.24-.12-1-.37-1.9-1.18-.7-.62-1.17-1.4-1.3-1.63-.13-.24-.02-.36.1-.48.11-.1.24-.27.36-.4.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.5-1.28-.7-1.75-.18-.43-.36-.37-.5-.38h-.42Z" />
    </svg>
  );
}
export function IconHelp({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.5a2.4 2.4 0 0 1 4.7.6c0 1.6-2.3 2-2.3 3.4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
export function IconTelegram({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21.9 4.3 18.7 19.4c-.24 1.07-.88 1.33-1.78.83l-4.9-3.61-2.37 2.28c-.26.26-.48.48-.99.48l.35-5 9.1-8.22c.4-.35-.09-.55-.62-.2L4.62 13.3l-4.85-1.52c-1.05-.33-1.07-1.05.22-1.55L20.55 2.9c.88-.33 1.65.2 1.35 1.4Z" />
    </svg>
  );
}
export function IconCheck({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
export function IconBack({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

// --- Admin console --------------------------------------------------------
function Stroked({ className = base, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

export const IconGrid = (p: IconProps) => (
  <Stroked {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </Stroked>
);

export const IconSearch = (p: IconProps) => (
  <Stroked {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Stroked>
);

export const IconCalendar = (p: IconProps) => (
  <Stroked {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Stroked>
);

export const IconClock = (p: IconProps) => (
  <Stroked {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Stroked>
);

export const IconEdit = (p: IconProps) => (
  <Stroked {...p}>
    <path d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4 16.5V20Z" />
    <path d="M14.5 6.5 17.5 9.5" />
  </Stroked>
);

export const IconTrash = (p: IconProps) => (
  <Stroked {...p}>
    <path d="M4 7h16M9.5 7V5h5v2M6.5 7l.9 12a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.9-12" />
    <path d="M10.5 11v6M13.5 11v6" />
  </Stroked>
);

export const IconMenu = (p: IconProps) => (
  <Stroked {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Stroked>
);

export const IconWallet = (p: IconProps) => (
  <Stroked {...p}>
    <path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11.5a2 2 0 0 1 2 2v1" />
    <rect x="3.5" y="8.5" width="17" height="11" rx="2.5" />
    <path d="M16.5 14h1.5" />
  </Stroked>
);

export const IconMegaphone = (p: IconProps) => (
  <Stroked {...p}>
    <path d="M4 10v4a1.5 1.5 0 0 0 1.5 1.5H8l7 4.5V5.5L8 10H5.5A1.5 1.5 0 0 0 4 11.5Z" />
    <path d="M18 9.5a3.5 3.5 0 0 1 0 5" />
  </Stroked>
);

export const IconInfo = (p: IconProps) => (
  <Stroked {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8h.01" />
  </Stroked>
);

export const IconUserPlus = (p: IconProps) => (
  <Stroked {...p}>
    <circle cx="9.5" cy="8" r="3.5" />
    <path d="M3 20c0-3.4 2.9-5.5 6.5-5.5 1.2 0 2.3.2 3.2.6" />
    <path d="M17.5 14v6M14.5 17h6" />
  </Stroked>
);

export const IconUserCog = (p: IconProps) => (
  <Stroked {...p}>
    <circle cx="9.5" cy="8" r="3.5" />
    <path d="M3 20c0-3.4 2.9-5.5 6.5-5.5 .7 0 1.4.08 2 .23" />
    <circle cx="17.5" cy="17" r="2.6" />
    <path d="M17.5 12.8v1.6M17.5 19.6v1.6M21 15l-1.4.8M15.4 18.2 14 19M21 19l-1.4-.8M15.4 15.8 14 15" />
  </Stroked>
);

export const IconKey = (p: IconProps) => (
  <Stroked {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 8-8M17 6l2 2M14.5 8.5l2 2" />
  </Stroked>
);

export const IconDatabase = (p: IconProps) => (
  <Stroked {...p}>
    <ellipse cx="12" cy="6" rx="7.5" ry="3" />
    <path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6" />
    <path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
  </Stroked>
);

export const IconUpload = (p: IconProps) => (
  <Stroked {...p}>
    <path d="M12 16V4.5M8 8l4-3.5L16 8" />
    <path d="M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
  </Stroked>
);

export const IconImage = (p: IconProps) => (
  <Stroked {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4.5 17.5 4.2-4a2 2 0 0 1 2.7-.06l5 4.4" />
  </Stroked>
);

export const IconChevronDown = (p: IconProps) => (
  <Stroked {...p}>
    <path d="m6 9 6 6 6-6" />
  </Stroked>
);

export const IconX = (p: IconProps) => (
  <Stroked {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Stroked>
);

export const IconMinus = (p: IconProps) => (
  <Stroked {...p}>
    <path d="M5 12h14" />
  </Stroked>
);

export const IconSliders = (p: IconProps) => (
  <Stroked {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Stroked>
);

export const IconTrendUp = (p: IconProps) => (
  <Stroked {...p}>
    <path d="M4 16.5 9.5 11l3.5 3.5L20 7" />
    <path d="M15.5 7H20v4.5" />
  </Stroked>
);

export const IconXCircle = (p: IconProps) => (
  <Stroked {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m9.5 9.5 5 5M14.5 9.5l-5 5" />
  </Stroked>
);

export const IconCheckCircle = (p: IconProps) => (
  <Stroked {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </Stroked>
);

export const IconBars = (p: IconProps) => (
  <Stroked {...p}>
    <path d="M5 19V11M12 19V5M19 19v-6" />
  </Stroked>
);

export const IconDot = ({ className = "h-2 w-2" }: IconProps) => (
  <svg viewBox="0 0 8 8" className={className} fill="currentColor" aria-hidden>
    <circle cx="4" cy="4" r="4" />
  </svg>
);
