"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Switch, useTheme } from "./theme";
import { IconBellOff, IconBell, IconBook, IconChevronRight, IconKey, IconSun } from "@/components/icons";

const NOTIFY_KEY = "tb.notify";

function Row({
  icon,
  tone,
  title,
  sub,
  right,
  href,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  sub: string;
  right?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>{icon}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[15px] font-bold text-ink">{title}</span>
        <span className="block truncate text-[12px] text-muted">{sub}</span>
      </span>
      {right}
    </>
  );

  const cls = "flex w-full items-center gap-3 px-3.5 py-3.5 transition hover:bg-panel-2/60";
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function ProfileSettings() {
  const { theme, toggle } = useTheme();
  const [notify, setNotify] = useState(false);

  useEffect(() => {
    setNotify(window.localStorage.getItem(NOTIFY_KEY) === "1");
  }, []);

  function toggleNotify() {
    setNotify((n) => {
      const next = !n;
      try {
        window.localStorage.setItem(NOTIFY_KEY, next ? "1" : "0");
      } catch {
        /* private mode — the choice just won't persist */
      }
      return next;
    });
  }

  const light = theme === "light";

  return (
    <section className="card-shadow overflow-hidden rounded-2xl border border-line bg-panel">
      <h2 className="border-b border-line px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
        Settings &amp; preferences
      </h2>

      <div className="divide-y divide-line">
        <Row
          icon={<IconSun className="h-[18px] w-[18px]" />}
          tone="bg-gold/12 text-gold"
          title={light ? "Light Mode" : "Dark Mode"}
          sub={light ? "Switch to dark theme" : "Switch to light theme"}
          right={<Switch on={!light} onChange={toggle} label="Toggle dark theme" />}
        />
        <Row
          icon={notify ? <IconBell className="h-[18px] w-[18px]" /> : <IconBellOff className="h-[18px] w-[18px]" />}
          tone="bg-panel-2 text-muted"
          title="Notifications"
          sub={notify ? "Match reminders on" : "Match reminders off"}
          right={<Switch on={notify} onChange={toggleNotify} label="Toggle notifications" />}
        />
        <Row
          icon={<IconBook className="h-[18px] w-[18px]" />}
          tone="bg-back/12 text-back"
          title="App Rules"
          sub="Platform rules & guidelines"
          href="/play/rules"
          right={<IconChevronRight className="h-4 w-4 shrink-0 text-muted" />}
        />
        <Row
          icon={<IconKey className="h-[18px] w-[18px]" />}
          tone="bg-gold/12 text-gold"
          title="Change Password"
          sub="Update your login password"
          href="/play/account/password"
          right={<IconChevronRight className="h-4 w-4 shrink-0 text-muted" />}
        />
      </div>
    </section>
  );
}
