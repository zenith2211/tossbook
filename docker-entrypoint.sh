#!/bin/sh
# Boot sequence for Toss Book:
#   1. If a Litestream replica is configured, restore the DB from it (so data
#      survives a redeploy / ephemeral-disk wipe).
#   2. Run the Next.js server under Litestream so every write is replicated and
#      the final writes are flushed on shutdown (SIGTERM).
# If LITESTREAM_BUCKET is not set, just run the app (data stays ephemeral).
set -e

DB_PATH="/app/data/tossbook.db"
mkdir -p /app/data

if [ -n "$LITESTREAM_BUCKET" ]; then
  echo "[entrypoint] Litestream enabled — restoring $DB_PATH if a replica exists…"
  litestream restore -if-replica-exists "$DB_PATH" || echo "[entrypoint] No replica to restore (fresh start)."
  echo "[entrypoint] Starting app under Litestream replication…"
  exec litestream replicate -exec "npm start"
else
  echo "[entrypoint] LITESTREAM_BUCKET not set — running WITHOUT backup (data is ephemeral)."
  exec npm start
fi
