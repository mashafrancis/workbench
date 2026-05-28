<p align="center">
  <a href="https://getworkbench.dev">
    <img src="https://raw.githubusercontent.com/pontusab/workbench/main/hero.png" alt="Workbench — the missing dashboard for BullMQ" />
  </a>
</p>

# @getworkbench/hono

Hono adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Node apps.

Mounts as a route in your existing Hono app. No separate service.

## Migrating from bull-board?

Replace `@bull-board/hono` with `@getworkbench/hono` — same Redis, same queues, no schema change. Remove the old bull-board mount, then run `npx @getworkbench/cli init` or follow the install steps below.

Full comparison: [Workbench vs Bull Board](https://getworkbench.dev/blog/workbench-vs-bull-board)

## Install

```bash
npm i @getworkbench/hono bullmq hono
```

Or with the CLI:

```bash
npx @getworkbench/cli init
```

The CLI detects your Hono entrypoint, installs this package, injects the mount, and writes `.env.example` entries.

## Usage

```ts
import { Hono } from "hono";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/hono";

const app = new Hono();
const emailQueue = new Queue("email", {
  connection: { url: process.env.REDIS_URL! },
});

app.route(
  "/jobs",
  workbench({
    queues: [emailQueue],
    auth: {
      username: process.env.WORKBENCH_USER!,
      password: process.env.WORKBENCH_PASS!,
    },
  }),
);

export default app;
```

Visit `http://localhost:PORT/jobs`.

## Requirements

- Node 18+ (or any other runtime Hono supports)
- Hono 4+
- TypeScript 5.0+ (if you build with `tsc`). This adapter's public types reference `Hono`, and Hono 4's bundled `.d.ts` uses `const` type parameters introduced in TS 5.0. The other Workbench adapters (Express, Fastify, NestJS, Next.js, Elysia) do not have this requirement.

## Options

| Option     | Type                        | Description                                            |
| ---------- | --------------------------- | ------------------------------------------------------ |
| `queues`   | `Queue[]`                   | BullMQ `Queue` instances to display. Required.         |
| `auth`     | `{ username, password }`    | Basic auth credentials. Strongly recommended in prod.  |
| `title`    | `string`                    | Dashboard title. Default: `"Workbench"`.               |
| `logo`     | `string`                    | Logo URL to display in the nav.                        |
| `basePath` | `string`                    | Override base path detection.                          |
| `readonly` | `boolean`                   | Disable actions (retry, remove, promote).              |
| `tags`     | `string[]`                  | Fields from `job.data` to extract as filterable tags.  |

## Documentation

[getworkbench.dev](https://getworkbench.dev) · [GitHub](https://github.com/pontusab/workbench)

## License

MIT
