# 🏏 Toss Book — Live Cricket Toss & Match Gaming Arena

A full-stack cricket **toss betting book**: a single **Admin** manages clients, matches,
odds, betting cut-offs and results; clients place **toss** and **match-winner** bets in ₹
from a mobile-first arena. Built as original software.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · SQLite (better-sqlite3).

---

## Run locally

```bash
npm install
cp .env.example .env      # then edit .env and set a strong ADMIN_PASSWORD
npm run dev
```

Open <http://localhost:3000>. On first run against an **empty database**, one admin account
is created from your environment variables — nothing else (no demo clients, no sample matches).

| Variable         | Purpose                                              | Default        |
| ---------------- | ---------------------------------------------------- | -------------- |
| `ADMIN_USERNAME` | The admin login                                      | `admin`        |
| `ADMIN_PASSWORD` | The admin password (**set this!**)                   | `admin123` ⚠️  |
| `ADMIN_FLOAT`    | The admin's opening house float (₹) to fund clients  | `1000000000`   |

> If `ADMIN_PASSWORD` is unset the app logs a warning and uses `admin123` — never do this in production.

## First steps as admin

1. Log in with your `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
2. **Clients** → add a client, set an opening balance (funds move from your float).
3. **Matches** → create a match: teams, **odds for Team A / Team B**, start time, and a
   **betting-close time** (after which betting locks).
4. Clients bet **one side per market**; after the close time betting locks.
5. **Declare the winner** — winners are paid their odds (a ₹100 bet at 2.50 returns ₹250),
   losers forfeit their stake, exposure is released, and ledgers update.

---

## Features

- **Client arena** — live/upcoming matches, bet slip with live **returns**, one-sided betting,
  **betting cut-off**, My Bets (tiles + search + filters), Results, Rules, statement, account.
- **Admin** — dashboard, clients (add / fund / lock / reset password), matches (odds, min/max
  stakes, open/suspend/close, betting cut-off), **declare results → auto-settle**, all bets,
  profit/loss reports, own ledger.
- **Money model** — real ₹ balances; a bet holds the stake as **exposure** until settlement;
  `available = balance − exposure`; the book's P&L mirrors clients' realised results.

---

## Deploy (self-host)

The app needs a **persistent filesystem** for the SQLite database (`/app/data`), so use a host
that offers one (a VPS, or a platform with a mounted disk) — plain serverless won't persist it.

**Docker (recommended):**

```bash
docker build -t tossbook .
docker run -d -p 3000:3000 \
  -e ADMIN_USERNAME=youradmin \
  -e ADMIN_PASSWORD='a-long-strong-password' \
  -v tossbook_data:/app/data \
  --name tossbook tossbook
```

Then put it behind a reverse proxy (Caddy/Nginx) with HTTPS. Back up the `tossbook_data`
volume regularly — it holds every account, bet and ledger entry.

**Bare Node (VPS):** `npm ci && npm run build && npm start` behind a process manager
(pm2/systemd) and an HTTPS reverse proxy; keep the `data/` directory on persistent storage.

> ⚠️ **Before running this publicly for real money:** operating an online betting/gambling
> service is regulated and, in many jurisdictions (India included), illegal without a licence.
> This app has no age verification, KYC, or responsible-gambling controls. Ensure you are
> legally permitted to operate before exposing it to real users.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm start          # run the production build
npm run reset-db   # wipe the database (re-seeds the admin on next start)
```
