"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth-actions";
import { coins, moneyShort } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { IconLogout, IconMenu, IconWallet, IconX } from "@/components/icons";

const MENU = [
  { href: "/play", label: "Matches" },
  { href: "/play/bets", label: "My Picks" },
  { href: "/play/statement", label: "Passbook" },
  { href: "/play/rules", label: "Rules" },
  { href: "/play/account", label: "Profile" },
];

export function PlayHeader({ username, balance }: { username: string; balance: number }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-panel">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-2.5 sm:px-4">
          <Link href="/play" className="flex shrink-0 items-center gap-2.5" aria-label="Matches">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#26354a] to-[#0f1825] shadow-md shadow-black/20 ring-2 ring-gold/40">
              <span className="font-display text-sm font-extrabold text-gold">{BRAND.prefix}</span>
            </span>
            <span className="font-display whitespace-nowrap text-[17px] font-extrabold tracking-tight">
              <span className="text-ink">{BRAND.prefix} </span>
              <span className="text-brand">
                {BRAND.first} {BRAND.second}
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand/35 bg-brand/5 px-3 py-1.5 text-[12px] font-bold tabular-nums text-brand">
              <IconWallet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{coins(balance)}</span>
              <span className="sm:hidden">{moneyShort(balance)}</span>
            </span>

            <form action={logoutAction}>
              <button
                className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-panel-2 hover:text-lay"
                aria-label="Sign out"
              >
                <IconLogout className="h-[18px] w-[18px]" />
              </button>
            </form>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-panel-2 hover:text-ink"
            >
              <IconMenu className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <aside
            className="h-full w-72 max-w-[85vw] overflow-y-auto border-l border-line bg-panel p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-extrabold tracking-tight">
                <span className="text-ink">{BRAND.prefix} </span>
                <span className="text-brand">{BRAND.first}</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-panel-2 hover:text-ink"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-line bg-panel-2 px-3.5 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Signed in as</div>
              <div className="font-display text-base font-bold text-ink">{username}</div>
              <div className="mt-1 text-sm font-bold tabular-nums text-brand">{coins(balance)}</div>
            </div>

            <nav className="mt-4 space-y-1">
              {MENU.map((m) => {
                const active = m.href === "/play" ? path === m.href : path.startsWith(m.href);
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    className={`block rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                      active ? "bg-brand/10 text-brand" : "text-ink/70 hover:bg-panel-2"
                    }`}
                  >
                    {m.label}
                  </Link>
                );
              })}
            </nav>

            <form action={logoutAction} className="mt-4">
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-lay/35 bg-lay/5 px-3 py-2.5 text-sm font-bold text-lay transition hover:bg-lay/10">
                <IconLogout className="h-4 w-4" /> Sign out
              </button>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
