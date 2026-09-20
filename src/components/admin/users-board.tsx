"use client";

import { useMemo, useState } from "react";
import { UserCard, type UserCardView } from "./user-card";
import { EmptyState, StatTile } from "./kit";
import { coins } from "@/lib/format";
import { IconSearch, IconUsers } from "@/components/icons";

export function UsersBoard({ users }: { users: UserCardView[] }) {
  const [query, setQuery] = useState("");

  const totals = useMemo(() => {
    const balance = users.reduce((s, u) => s + u.balance, 0);
    return { count: users.length, balance, avg: users.length ? balance / users.length : 0 };
  }, [users]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
  }, [users, query]);

  return (
    <div className="space-y-4">
      <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="text-brand">
            <IconUsers className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl font-extrabold text-ink">Users</h2>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          <StatTile label="Total users" value={totals.count} />
          <StatTile label="Total balance" value={coins(totals.balance)} tone="gold" />
          <StatTile label="Avg balance" value={coins(Math.round(totals.avg))} tone="brand" />
        </div>

        <label className="relative mt-3.5 block">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username…"
            aria-label="Search users"
            className="w-full rounded-xl border border-transparent bg-panel-2 py-2.5 pl-10 pr-3 text-sm font-medium text-ink outline-none inset-soft placeholder:font-normal placeholder:text-muted/80 focus:border-brand/40 focus:bg-panel focus:ring-4 focus:ring-brand/10"
          />
        </label>
      </section>

      {visible.length === 0 ? (
        <EmptyState
          icon={<IconUsers className="h-8 w-8" />}
          title={users.length === 0 ? "No users yet" : "No user matches that search"}
          hint={
            users.length === 0
              ? "Create your first client from the User Mgmt tab — a secure password is generated for you."
              : "Check the spelling or clear the search box."
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((u) => (
            <UserCard key={u.id} u={u} />
          ))}
        </div>
      )}
    </div>
  );
}
