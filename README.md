# Installer Notes

Community knowledge base for window-tint and PPF installers: search a vehicle, read and share
per-vehicle install notes, per-panel difficulty, photos, ratings, a leaderboard and profiles.
One deploy serves tintnotes.com, ppfnotes.com and installernotes.com — branding is picked by
hostname in `src/proxy.ts`. Part of the SnapTip platform (snaptip.app is the separate paid app).

Next.js 16 (App Router) + React 19, Supabase (auth + Postgres + Storage), Resend (email),
Anthropic SDK (note moderation). Server components and server actions throughout.

**Start at `CLAUDE.md`** — it routes to everything and carries the shared-database warning.

## Run

```bash
npm install
cp .env.example .env.local   # fill in Supabase, Resend, Anthropic, CRON_SECRET
npm run dev
```

## Deploy

Vercel, from `main` (`next build` / `next start` — see `package.json`). `vercel.json` schedules
one cron: `GET /api/cron/campaign-drip` at `0 19 * * *` (daily 19:00 UTC) for the email drip.

Schema changes: the Postgres database is **shared with SnapTip** — read
`supabase/migrations/README.md` before writing SQL. Migrations are applied by hand in the
Supabase Dashboard SQL editor; no project credentials live in this repo.
