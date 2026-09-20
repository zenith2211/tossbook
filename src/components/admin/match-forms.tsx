"use client";

import { useRef, useState } from "react";
import { createMatchAction, updateMatchAction } from "@/lib/actions/admin-actions";
import { ActionForm, SubmitButton, Modal } from "@/components/form";
import { FormField, fieldCls, fieldLabelCls, btnCls, IconTile } from "./kit";
import type { MatchCardView } from "./match-view";
import { IconBolt, IconDot, IconEdit, IconImage, IconPlus, IconUpload, IconX } from "@/components/icons";

/** Largest poster we inline as a data URL — bigger images must be a URL. */
const MAX_UPLOAD_BYTES = 1_000_000;

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in the *browser's* timezone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function PosterPicker({ defaultUrl = "" }: { defaultUrl?: string }) {
  const [value, setValue] = useState(defaultUrl);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const isData = value.startsWith("data:");

  function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    if (file.size > MAX_UPLOAD_BYTES) return setError("That image is over 1 MB — pick a smaller one or paste a URL.");
    const reader = new FileReader();
    reader.onload = () => {
      setError("");
      setValue(String(reader.result ?? ""));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-xl border border-line bg-panel-2/60 p-3.5">
      <div className="flex items-center gap-2">
        <IconTile tone="lay">
          <IconImage className="h-4 w-4" />
        </IconTile>
        <span className="text-sm font-bold text-ink">
          Match Image <span className="text-[11px] font-medium text-muted">(optional)</span>
        </span>
      </div>

      <input type="hidden" name="imageUrl" value={value} />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <span className="mb-1.5 block text-[11px] font-semibold text-muted">Upload File</span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-[78px] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-panel text-muted transition hover:border-brand/40 hover:text-brand"
          >
            <IconUpload className="h-5 w-5" />
            <span className="text-[12px] font-semibold">Click to upload</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-[11px] font-semibold text-muted">Or paste URL</span>
          <input
            value={isData ? "" : value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://…"
            className={fieldCls}
            disabled={isData}
          />
        </div>
      </div>

      {value ? (
        <div className="mt-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Match poster preview" className="h-14 w-14 rounded-xl border border-line object-cover" />
          <span className="text-[12px] text-muted">{isData ? "Uploaded image attached" : "Poster URL set"}</span>
          <button
            type="button"
            onClick={() => {
              setValue("");
              if (fileRef.current) fileRef.current.value = "";
            }}
            className={btnCls("neutral", "ml-auto px-2.5 py-1.5")}
          >
            <IconX className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-[12px] font-semibold text-lay">{error}</p> : null}
    </div>
  );
}

function AutoStatusTimes({ live = "", close = "" }: { live?: string; close?: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel-2/60 p-3.5">
      <div className="flex items-center gap-2">
        <IconTile tone="gold">
          <IconBolt className="h-4 w-4" />
        </IconTile>
        <span className="text-sm font-bold text-ink">
          Auto-Status Times <span className="text-[11px] font-medium text-muted">(optional)</span>
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted">
            <IconDot className="h-2 w-2 text-emerald-500" /> Goes LIVE at
          </span>
          <input type="datetime-local" name="liveTime" defaultValue={live} className={fieldCls} />
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted">
            <IconDot className="h-2 w-2 text-lay" /> Picks CLOSE at
          </span>
          <input type="datetime-local" name="endTime" defaultValue={close} className={fieldCls} />
        </label>
      </div>
      <p className="mt-2 text-[11px] text-muted">
        The card flips to LIVE and then CLOSED on its own. After the close time nobody can place or cancel a pick.
      </p>
    </div>
  );
}

/** Inline "Create New Match" panel, opened by the board's + New Match button. */
export function CreateMatchPanel({ onClose }: { onClose: () => void }) {
  return (
    <section className="card-shadow animate-slide-down rounded-2xl border border-line bg-panel p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <IconTile tone="brand">
            <IconPlus className="h-4 w-4" />
          </IconTile>
          <h2 className="font-display text-lg font-extrabold text-ink">Create New Match</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-panel-2 hover:text-ink"
          aria-label="Close"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>

      <ActionForm action={createMatchAction} resetOnSuccess className="mt-4 space-y-3.5">
        <FormField label="Match title">
          <input name="league" placeholder="e.g. Indian Premier League 2026" className={fieldCls} />
        </FormField>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <FormField label="First team" required>
            <input name="teamA" required placeholder="e.g. Mumbai Indians" className={fieldCls} />
          </FormField>
          <FormField label="Second team" required>
            <input name="teamB" required placeholder="e.g. CSK" className={fieldCls} />
          </FormField>
          <FormField label="Odds — first team">
            <input name="rateA" inputMode="decimal" defaultValue="1.95" className={fieldCls} />
          </FormField>
          <FormField label="Odds — second team">
            <input name="rateB" inputMode="decimal" defaultValue="1.95" className={fieldCls} />
          </FormField>
          <FormField label="Max bet (₹)">
            <input name="maxStake" inputMode="numeric" defaultValue="50000" className={fieldCls} />
          </FormField>
          <FormField label="Match date & time" optional>
            <input type="datetime-local" name="startTime" className={fieldCls} />
          </FormField>
        </div>

        <input type="hidden" name="minStake" value="100" />
        <AutoStatusTimes />
        <PosterPicker />

        <div className="flex flex-wrap gap-2 pt-1">
          <SubmitButton idleClass={BTN_PRIMARY}>
            <IconPlus className="h-4 w-4" /> Create Match
          </SubmitButton>
          <button type="button" onClick={onClose} className={btnCls("neutral", "px-4")}>
            Cancel
          </button>
        </div>
      </ActionForm>
    </section>
  );
}

const BTN_PRIMARY =
  "bg-gradient-to-b from-brand to-brand-2 text-white shadow-sm shadow-brand/25 hover:brightness-110 px-4";

/** Edit everything about an existing match, including its close time. */
export function EditMatchModal({ m }: { m: MatchCardView }) {
  return (
    <Modal
      wide
      title={`Edit · ${m.title}`}
      trigger={(open) => (
        <button type="button" onClick={open} className={btnCls("neutral", "px-3 py-1.5")}>
          <IconEdit className="h-3.5 w-3.5" /> Edit
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={updateMatchAction} onSuccess={() => setTimeout(close, 900)} className="space-y-3.5">
          <input type="hidden" name="matchId" value={m.id} />

          <FormField label="Match title">
            <input name="league" defaultValue={m.league} className={fieldCls} />
          </FormField>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField label="First team" required>
              <input name="teamA" required defaultValue={m.teamA} className={fieldCls} />
            </FormField>
            <FormField label="Second team" required>
              <input name="teamB" required defaultValue={m.teamB} className={fieldCls} />
            </FormField>
            <FormField label="Odds — first team">
              <input name="rateA" inputMode="decimal" defaultValue={m.rateA} className={fieldCls} />
            </FormField>
            <FormField label="Odds — second team">
              <input name="rateB" inputMode="decimal" defaultValue={m.rateB} className={fieldCls} />
            </FormField>
            <FormField label="Max bet (₹)">
              <input name="maxStake" inputMode="numeric" defaultValue={m.maxStake} className={fieldCls} />
            </FormField>
            <FormField label="Match date & time" optional>
              <input type="datetime-local" name="startTime" defaultValue={toLocalInput(m.startTime)} className={fieldCls} />
            </FormField>
          </div>

          <AutoStatusTimes live={toLocalInput(m.liveTime)} close={toLocalInput(m.endTime)} />
          <PosterPicker defaultUrl={m.imageUrl ?? ""} />

          <div className="flex flex-wrap gap-2 pt-1">
            <SubmitButton idleClass={BTN_PRIMARY}>Save changes</SubmitButton>
            <button type="button" onClick={close} className={btnCls("neutral", "px-4")}>
              Cancel
            </button>
          </div>
        </ActionForm>
      )}
    </Modal>
  );
}

export { fieldLabelCls };
