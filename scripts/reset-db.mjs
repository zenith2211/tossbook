// Wipes the local SQLite database so the app re-seeds fresh demo data
// on next start. Usage: npm run reset-db
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
let removed = 0;
for (const suffix of ["", "-wal", "-shm"]) {
  const file = path.join(dataDir, `tossbook.db${suffix}`);
  if (existsSync(file)) {
    rmSync(file);
    removed++;
  }
}

console.log(
  removed > 0
    ? `Removed ${removed} database file(s). Restart the dev server to re-seed.`
    : "No database files found — nothing to reset.",
);
