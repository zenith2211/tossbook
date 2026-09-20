"use client";

import { Modal } from "@/components/form";
import { btnCls, IconTile } from "./kit";
import { IconCheckCircle, IconDatabase, IconXCircle } from "@/components/icons";

export interface DbInfo {
  tables: { name: string; rows: number }[];
  integrity: string;
  journal: string;
  pageSizeKb: number;
  sizeKb: number;
}

/** Read-only health report for the SQLite file behind the book. */
export function DbSetupModal({ info }: { info: DbInfo }) {
  const healthy = info.integrity === "ok";

  return (
    <Modal
      title="Database setup"
      trigger={(open) => (
        <button type="button" onClick={open} className={btnCls("gold", "px-3.5")}>
          <IconDatabase className="h-4 w-4" /> DB Setup
        </button>
      )}
    >
      {() => (
        <div className="space-y-3.5">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 ${
              healthy ? "border-emerald-500/30 bg-emerald-500/5" : "border-lay/35 bg-lay/5"
            }`}
          >
            <IconTile tone={healthy ? "green" : "lay"}>
              {healthy ? <IconCheckCircle className="h-4 w-4" /> : <IconXCircle className="h-4 w-4" />}
            </IconTile>
            <div>
              <div className={`font-display text-base font-bold ${healthy ? "text-emerald-600" : "text-lay"}`}>
                {healthy ? "Schema is healthy" : "Integrity check failed"}
              </div>
              <div className="text-[12px] text-muted">
                Tables are created and migrated automatically every time the app starts.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Tables", value: info.tables.length },
              { label: "Journal", value: info.journal.toUpperCase() },
              { label: "Size", value: `${info.sizeKb.toLocaleString("en-IN")} KB` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-line bg-panel-2 px-3 py-2.5 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{s.label}</div>
                <div className="font-display text-base font-bold text-ink">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-[12px]">
              <thead className="bg-panel-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2">Table</th>
                  <th className="px-3 py-2 text-right">Rows</th>
                </tr>
              </thead>
              <tbody>
                {info.tables.map((t) => (
                  <tr key={t.name} className="border-t border-line">
                    <td className="px-3 py-2 font-semibold text-ink">{t.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted">{t.rows.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-muted">
            Page size {info.pageSizeKb} KB · integrity check reports <b className="text-ink">{info.integrity}</b>.
          </p>
        </div>
      )}
    </Modal>
  );
}
