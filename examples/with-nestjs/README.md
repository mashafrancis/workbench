# example-with-nestjs

Minimal [NestJS](https://nestjs.com) example with the Workbench BullMQ dashboard mounted at `/jobs`.

The entry script also runs an in-process BullMQ worker and producer so the dashboard always has live data.

## Run

```bash
# 1. Boot Redis (from the repo root)
docker compose up -d redis

# 2. Install + start
bun install
bun run --filter example-with-nestjs dev
```

Then open <http://localhost:3000/jobs>.

Uses the default Express platform — the adapter also works with `@nestjs/platform-fastify`.

## Files

- `src/main.ts` — server, queues, worker, producer.
- `src/app.module.ts` — the NestJS root module.
