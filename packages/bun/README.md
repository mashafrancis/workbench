<p align="center">
  <a href="https://getworkbench.dev">
    <img src="https://raw.githubusercontent.com/pontusab/workbench/main/hero.png" alt="Workbench — the missing dashboard for BullMQ" />
  </a>
</p>

# @getworkbench/bun

`Bun.serve` adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Node/Bun apps.

Returns a `fetch` handler you drop straight into `Bun.serve({ fetch })`. No router, no framework, no separate service.

## Migrating from bull-board?

Workbench covers the same BullMQ use case with a modern UI, broader framework support, and a one-command install. Remove your `@bull-board/*` packages and run `npx @getworkbench/cli init`.

Full comparison: [Workbench vs Bull Board](https://getworkbench.dev/blog/workbench-vs-bull-board)

## Install

```bash
bun add @getworkbench/bun bullmq
```

Or with the CLI:

```bash
bunx @getworkbench/cli init
```

## Usage — standalone server

```ts
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/bun";

const emailQueue = new Queue("email", {
  connection: { url: process.env.REDIS_URL! },
});

const handler = workbench({
  queues: [emailQueue],
  auth: {
    username: process.env.WORKBENCH_USER!,
    password: process.env.WORKBENCH_PASS!,
  },
});

Bun.serve({ port: 3000, fetch: handler });
```

Visit `http://localhost:3000/`.

## Usage — composed with your own routes

Pass a `basePath` and forward non-dashboard requests via the `next` callback:

```ts
const handler = workbench({ queues: [emailQueue], basePath: "/jobs" });

Bun.serve({
  port: 3000,
  fetch(req) {
    return handler(req, () => new Response("Hello!"));
  },
});
```

Visit `http://localhost:3000/jobs`.

## Requirements

- Bun 1.1+
- TypeScript 4.x or 5.x (no specific minimum)

## Options

| Option     | Type                        | Description                                            |
| ---------- | --------------------------- | ------------------------------------------------------ |
| `queues`   | `Queue[]`                   | BullMQ `Queue` instances to display. Required.         |
| `auth`     | `{ username, password }`    | Basic auth credentials. Strongly recommended in prod.  |
| `title`    | `string`                    | Dashboard title. Default: `"Workbench"`.               |
| `logo`     | `string`                    | Logo URL to display in the nav.                        |
| `basePath` | `string`                    | Mount the dashboard under a prefix (e.g. `"/jobs"`).   |
| `readonly` | `boolean`                   | Disable actions (retry, remove, promote).              |
| `tags`     | `string[]`                  | Fields from `job.data` to extract as filterable tags.  |

## Documentation

[getworkbench.dev](https://getworkbench.dev) · [GitHub](https://github.com/pontusab/workbench)

## License

MIT
