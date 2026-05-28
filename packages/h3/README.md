<p align="center">
  <a href="https://getworkbench.dev">
    <img src="https://raw.githubusercontent.com/pontusab/workbench/main/hero.png" alt="Workbench — the missing dashboard for BullMQ" />
  </a>
</p>

# @getworkbench/h3

[h3](https://h3.unjs.io) adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Node apps.

Works with any framework built on h3 — standalone h3, [Nitro](https://nitro.unjs.io), [Nuxt 3](https://nuxt.com), [SolidStart](https://start.solidjs.com), [Analog](https://analogjs.org), etc.

> Using **Nuxt**? Install [`@getworkbench/nuxt`](../nuxt) instead — same engine, Nuxt-specific docs and CLI scaffolding.

## Migrating from bull-board?

Replace `@bull-board/h3` with `@getworkbench/h3` — same Redis, same queues, no schema change. Remove the old bull-board mount, then run `npx @getworkbench/cli init` or follow the install steps below.

Full comparison: [Workbench vs Bull Board](https://getworkbench.dev/blog/workbench-vs-bull-board)

## Install

```bash
npm i @getworkbench/h3 bullmq h3
```

Or with the CLI:

```bash
npx @getworkbench/cli init
```

## Usage — standalone h3 on Node

```ts
import { createServer } from "node:http";
import { createApp, createRouter, toNodeListener } from "h3";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/h3";

const emailQueue = new Queue("email", {
  connection: { url: process.env.REDIS_URL! },
});

const handler = workbench({
  queues: [emailQueue],
  basePath: "/jobs",
  auth: {
    username: process.env.WORKBENCH_USER!,
    password: process.env.WORKBENCH_PASS!,
  },
});

const router = createRouter().use("/jobs", handler).use("/jobs/**", handler);

const app = createApp().use(router);

createServer(toNodeListener(app)).listen(3000);
```

> Register the handler at both the bare prefix (`/jobs`) and the catch-all
> (`/jobs/**`). h3's `**` matches one-or-more sub-segments, so the bare
> mount needs its own registration for `/jobs` and `/jobs/`.

Visit `http://localhost:3000/jobs`.

## Usage — Nitro / SolidStart / Analog

Drop the handler into a server route file in your framework's `server/` (or
`routes/`) directory. The exact filename convention is up to your
framework — exporting the `EventHandler` is enough.

## Requirements

- Node 18+
- h3 1.10+
- TypeScript 4.x or 5.x (no specific minimum)

## Options

| Option     | Type                        | Description                                            |
| ---------- | --------------------------- | ------------------------------------------------------ |
| `queues`   | `Queue[]`                   | BullMQ `Queue` instances to display. Required.         |
| `basePath` | `string`                    | Mount path (e.g. `"/jobs"`). **Required.**             |
| `auth`     | `{ username, password }`    | Basic auth credentials. Strongly recommended in prod.  |
| `title`    | `string`                    | Dashboard title. Default: `"Workbench"`.               |
| `logo`     | `string`                    | Logo URL to display in the nav.                        |
| `readonly` | `boolean`                   | Disable actions (retry, remove, promote).              |
| `tags`     | `string[]`                  | Fields from `job.data` to extract as filterable tags.  |

## Documentation

[getworkbench.dev](https://getworkbench.dev) · [GitHub](https://github.com/pontusab/workbench)

## License

MIT
