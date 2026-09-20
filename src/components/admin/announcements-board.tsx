"use client";

import { useState } from "react";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementAction,
} from "@/lib/actions/admin-actions";
import { useAction } from "./use-action";
import { btnCls, EmptyState, fieldCls, IconTile } from "./kit";
import { fmtDateTime } from "@/lib/format";
import { IconMegaphone, IconPlus, IconTrash } from "@/components/icons";

export interface AnnouncementView {
  id: number;
  text: string;
  active: boolean;
  createdAt: string;
}

const SUGGESTIONS = ["🔥", "⚡", "🏆", "💰", "📢", "⭐"];

export function AnnouncementsBoard({ items }: { items: AnnouncementView[] }) {
  const [text, setText] = useState("");
  const post = useAction(createAnnouncementAction);

  return (
    <div className="space-y-4">
      <section className="card-shadow rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="text-brand">
            <IconMegaphone className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl font-extrabold text-ink">Announcements</h2>
        </div>

        <div className="mt-4 rounded-2xl border border-line bg-panel-2/40 p-3.5 sm:p-4">
          <div className="flex items-center gap-2.5">
            <IconTile tone="gold">
              <IconPlus className="h-4 w-4" />
            </IconTile>
            <div>
              <h3 className="font-display text-base font-bold leading-tight text-ink">New announcement</h3>
              <p className="text-[11px] text-muted">Active messages scroll across the ticker under the header.</p>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, 200));
              post.clear();
            }}
            rows={2}
            placeholder="e.g. ALL 100 PAISE ENJOY 🔥🔥🔥"
            className={`${fieldCls} mt-3.5 resize-none`}
          />

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {SUGGESTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setText((t) => `${t}${e}`)}
                className="rounded-lg border border-line bg-panel px-2.5 py-1 text-sm transition hover:border-brand/40"
                aria-label={`Add ${e}`}
              >
                {e}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-muted">{text.length}/200</span>
          </div>

          <button
            type="button"
            disabled={text.trim().length < 2 || post.pending}
            onClick={() => post.run({ text }, (r) => r.ok && setText(""))}
            className={btnCls("primary", "mt-2.5 w-full py-3")}
          >
            <IconMegaphone className="h-4 w-4" />
            {post.pending ? "Posting…" : "Post to ticker"}
          </button>

          {post.result ? (
            <p className={`mt-2 text-[12px] font-semibold ${post.result.ok ? "text-brand" : "text-lay"}`}>
              {post.result.ok ? post.result.message : post.result.error}
            </p>
          ) : null}
        </div>
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon={<IconMegaphone className="h-8 w-8" />}
          title="Nothing on the ticker"
          hint="Post an announcement above and it starts scrolling for everyone right away."
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((a) => (
            <article
              key={a.id}
              className={`card-shadow flex items-start gap-3 rounded-2xl border bg-panel p-3.5 ${
                a.active ? "border-line" : "border-dashed border-line opacity-70"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${a.active ? "text-ink" : "text-muted line-through"}`}>{a.text}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {a.active ? "Live on the ticker" : "Hidden"} · {fmtDateTime(a.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 gap-1.5">
                <form action={toggleAnnouncementAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className={btnCls(a.active ? "neutral" : "green", "px-2.5 py-1.5")}>
                    {a.active ? "Hide" : "Show"}
                  </button>
                </form>
                <form action={deleteAnnouncementAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className={btnCls("red", "px-2.5 py-1.5")} aria-label="Delete announcement">
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
