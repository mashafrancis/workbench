# example-with-next

Minimal [Next.js](https://nextjs.org) (App Router) example with the Workbench BullMQ dashboard mounted at `/jobs`.

A sibling worker process (started in parallel by `bun run dev`) produces and consumes jobs so the dashboard always has live data.

## Run

```bash
# 1. Boot Redis (from the repo root)
docker compose up -d redis

# 2. Install + start
bun install
bun run --filter example-with-next dev
```

Then open <http://localhost:3000/jobs>.

Requires Next.js 14 or newer (App Router).

## Files

- `app/jobs/[[...workbench]]/route.ts` — Workbench catch-all mount.
- `app/queues.ts` — shared BullMQ `Queue` instances.
- `scripts/worker.ts` — sibling worker process (Next doesn't host workers itself).
- `app/page.tsx` / `app/layout.tsx` — landing page.
