"use client";

import { useState } from "react";
import { createUserAction, deleteUserAction, resetPasswordAction } from "@/lib/actions/admin-actions";
import { useAction } from "./use-action";
import { btnCls, fieldCls, IconTile, selectCls, selectStyle } from "./kit";
import { DEFAULT_CLIENT_PASSWORD } from "@/lib/defaults";
import { IconCheck, IconKey, IconTrash, IconUserPlus, IconUsers } from "@/components/icons";

export interface ManagedUser {
  id: number;
  username: string;
}

function Card({
  tone,
  icon,
  title,
  hint,
  children,
}: {
  tone: "green" | "lay" | "gold";
  icon: React.ReactNode;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-panel-2/40 p-3.5 sm:p-4">
      <div className="flex items-center gap-2.5">
        <IconTile tone={tone}>{icon}</IconTile>
        <div>
          <h3 className="font-display text-base font-bold leading-tight text-ink">{title}</h3>
          <p className="text-[11px] text-muted">{hint}</p>
        </div>
      </div>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

function CreateUser() {
  const [username, setUsername] = useState("");
  const create = useAction(createUserAction);
  const valid = /^[a-zA-Z0-9_]{3,20}$/.test(username);

  // On success the action hands back "username · password" so the admin can
  // pass the starter credentials straight on to the client.
  const credentials = create.result?.ok ? (create.result.message ?? "").split(" · ") : null;

  return (
    <Card
      tone="green"
      icon={<IconUserPlus className="h-4 w-4" />}
      title="Create User"
      hint={`Default password ${DEFAULT_CLIENT_PASSWORD} is set automatically.`}
    >
      <input
        value={username}
        onChange={(e) => {
          setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""));
          create.clear();
        }}
        placeholder="Username"
        autoCapitalize="none"
        spellCheck={false}
        className={fieldCls}
      />
      <button
        type="button"
        disabled={!valid || create.pending}
        onClick={() => create.run({ username })}
        className={btnCls("primary", "mt-2.5 w-full py-3")}
      >
        <IconUserPlus className="h-4 w-4" />
        {create.pending ? "Creating…" : "Create User"}
      </button>

      {username && !valid ? (
        <p className="mt-2 text-[11px] text-muted">3–20 characters — letters, numbers and underscore only.</p>
      ) : null}

      {credentials ? (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600">
            <IconCheck className="h-3.5 w-3.5" /> Account created — share these with the client
          </p>
          <dl className="mt-2 space-y-1 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Username</dt>
              <dd className="font-bold text-ink">{credentials[0]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Password</dt>
              <dd className="font-mono font-bold text-ink">{credentials[1]}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(`Username: ${credentials[0]}\nPassword: ${credentials[1]}`)}
            className={btnCls("neutral", "mt-2.5 w-full py-2")}
          >
            Copy credentials
          </button>
          <p className="mt-2 text-[11px] text-muted">The client must change this password at their first login.</p>
        </div>
      ) : null}

      {create.result && !create.result.ok ? (
        <p className="mt-2 text-[12px] font-semibold text-lay">{create.result.error}</p>
      ) : null}
    </Card>
  );
}

function RemoveUser({ users }: { users: ManagedUser[] }) {
  const [userId, setUserId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const remove = useAction(deleteUserAction);
  const target = users.find((u) => String(u.id) === userId);

  return (
    <Card
      tone="lay"
      icon={<IconTrash className="h-4 w-4" />}
      title="Remove User"
      hint="Permanently deletes the account and all data."
    >
      <select
        value={userId}
        onChange={(e) => {
          setUserId(e.target.value);
          setConfirming(false);
          remove.clear();
        }}
        className={selectCls}
        style={selectStyle}
      >
        <option value="">Select user to delete…</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.username}
          </option>
        ))}
      </select>

      {confirming && target ? (
        <div className="mt-2.5 rounded-xl border border-lay/35 bg-lay/5 p-3">
          <p className="text-[12px] font-semibold text-ink">
            Delete <b>{target.username}</b> permanently? Their bets, wallet log and balance go with them.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={remove.pending}
              onClick={() =>
                remove.run({ userId, confirm: "DELETE" }, (r) => {
                  if (r.ok) {
                    setUserId("");
                    setConfirming(false);
                  }
                })
              }
              className={btnCls("red", "flex-1 py-2.5")}
            >
              {remove.pending ? "Deleting…" : "Yes, delete"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={btnCls("neutral", "flex-1 py-2.5")}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={!userId}
          onClick={() => setConfirming(true)}
          className={`${btnCls("red", "mt-2.5 w-full py-3")} border-transparent bg-lay text-white hover:brightness-110`}
        >
          <IconTrash className="h-4 w-4" /> Delete User
        </button>
      )}

      {remove.result ? (
        <p className={`mt-2 text-[12px] font-semibold ${remove.result.ok ? "text-brand" : "text-lay"}`}>
          {remove.result.ok ? remove.result.message : remove.result.error}
        </p>
      ) : null}
    </Card>
  );
}

function ResetPassword({ users }: { users: ManagedUser[] }) {
  const [childId, setChildId] = useState("");
  const [password, setPassword] = useState("");
  const reset = useAction(resetPasswordAction);
  const ready = childId !== "" && password.length >= 6;

  return (
    <Card
      tone="gold"
      icon={<IconKey className="h-4 w-4" />}
      title="Reset Password"
      hint="Sets a temporary password the client must change at next login."
    >
      <div className="space-y-2.5">
        <select
          value={childId}
          onChange={(e) => {
            setChildId(e.target.value);
            reset.clear();
          }}
          className={selectCls}
          style={selectStyle}
        >
          <option value="">Select user…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.username}
            </option>
          ))}
        </select>

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 6 characters)"
          autoCapitalize="none"
          spellCheck={false}
          className={fieldCls}
        />

        <button
          type="button"
          disabled={!ready || reset.pending}
          onClick={() => reset.run({ childId, password }, (r) => r.ok && setPassword(""))}
          className={btnCls("primary", "w-full py-3")}
        >
          <IconKey className="h-4 w-4" />
          {reset.pending ? "Resetting…" : "Reset Password"}
        </button>
      </div>

      {reset.result ? (
        <p className={`mt-2 text-[12px] font-semibold ${reset.result.ok ? "text-brand" : "text-lay"}`}>
          {reset.result.ok ? reset.result.message : reset.result.error}
        </p>
      ) : null}
    </Card>
  );
}

export function UserMgmt({ users }: { users: ManagedUser[] }) {
  return (
    <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="text-brand">
          <IconUsers className="h-5 w-5" />
        </span>
        <h2 className="font-display text-xl font-extrabold text-ink">User Mgmt</h2>
      </div>

      <div className="mt-4 space-y-3.5">
        <CreateUser />
        <RemoveUser users={users} />
        <ResetPassword users={users} />
      </div>
    </section>
  );
}
