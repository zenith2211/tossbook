"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth-actions";
import { coins, moneyShort } from "@/lib/format";
import { BrandMark } from "./brand-mark";
import {
  IconEye,
  IconEyeOff,
  IconLogout,
  IconMenu,
  IconShield,
  IconUser,
  IconWallet,
  IconX,
} from "@/components/icons";

const STORE_KEY = "tb.hideBalance";

export type MenuLink = { href: string; label: string };

export function AdminHeader({
  username,
  balance,
  roleLabel,
  menu,
}: {
  username: string;
  balance: number;
  roleLabel: string;
  menu: MenuLink[];
}) {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  // Remember the balance-visibility choice across navigations.
  useEffect(() => {
    setHidden(window.localStorage.getItem(STORE_KEY) === "1");
  }, []);

  function toggleBalance() {
    setHidden((h) => {
      window.localStorage.setItem(STORE_KEY, h ? "0" : "1");
      return !h;
    });
  }

  // Close the drawer whenever the route changes.
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // No display utility here on purpose — each chip picks its own, so a
  // `hidden md:inline-flex` can't collide with a base `inline-flex`.
  const chip =
    "shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold sm:px-3 sm:text-xs";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-panel/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-1.5 px-2.5 py-2.5 sm:gap-2 sm:px-4">
          <Link href="/admin" aria-label="Admin home" className="min-w-0">
            <BrandMark />
          </Link>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <span className={`${chip} hidden border-line bg-panel text-ink/70 md:inline-flex`}>
              <IconUser className="h-3.5 w-3.5 text-muted" />
              {username}
              <button
                type="button"
                onClick={toggleBalance}
                aria-label={hidden ? "Show balance" : "Hide balance"}
                aria-pressed={hidden}
                className="text-muted transition hover:text-ink"
              >
                {hidden ? <IconEyeOff className="h-3.5 w-3.5" /> : <IconEye className="h-3.5 w-3.5" />}
              </button>
            </span>

            <button
              type="button"
              onClick={toggleBalance}
              className={`${chip} inline-flex border-line bg-panel text-ink/80 tabular-nums`}
              aria-label="Toggle balance visibility"
            >
              <IconWallet className="h-3.5 w-3.5 shrink-0 text-muted" />
              <span className="hidden sm:inline">{hidden ? "••••" : coins(balance)}</span>
              <span className="sm:hidden">{hidden ? "••••" : moneyShort(balance)}</span>
            </button>

            <span className={`${chip} inline-flex border-gold/40 bg-gold/10 text-gold`}>
              <IconShield className="h-3.5 w-3.5" />
              {roleLabel}
            </span>

            <form action={logoutAction} className="hidden sm:block">
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
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-panel-2 hover:text-ink sm:h-9 sm:w-9"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <IconMenu className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#0d1b2a]/35 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <aside
            className="h-full w-72 max-w-[85vw] overflow-y-auto border-l border-line bg-panel p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <BrandMark compact />
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-panel-2 hover:text-ink"
                aria-label="Close menu"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-line bg-panel-2 px-3.5 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Signed in as</div>
              <div className="font-display text-base font-bold text-ink">{username}</div>
              <div className="mt-1 text-sm font-bold tabular-nums text-gold">{hidden ? "••••" : coins(balance)}</div>
            </div>

            <nav className="mt-4 space-y-1">
              {menu.map((m) => {
                const active = m.href === "/admin" ? path === m.href : path.startsWith(m.href);
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
