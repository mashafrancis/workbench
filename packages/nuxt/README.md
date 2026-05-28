<p align="center">
  <a href="https://getworkbench.dev">
    <img src="https://raw.githubusercontent.com/pontusab/workbench/main/hero.png" alt="Workbench — the missing dashboard for BullMQ" />
  </a>
</p>

# @getworkbench/nuxt

Nuxt (Nitro / h3) adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Node apps.

Mounts as a single catch-all server route in your existing Nuxt app. No separate service.

## Migrating from bull-board?

Workbench covers the same BullMQ use case with a modern UI, broader framework support, and a one-command install. Remove your `@bull-board/*` packages and run `npx @getworkbench/cli init`.

Full comparison: [Workbench vs Bull Board](https://getworkbench.dev/blog/workbench-vs-bull-board)

## Install

```bash
npm i @getworkbench/nuxt bullmq
```

Or with the CLI:

```bash
npx @getworkbench/cli init
```

## Usage

Nitro's `[...].ts` catch-all matches sub-segments only, so register the
handler in three small files that share one shared handler — the bare
`/jobs` and the catch-all `/jobs/**` both delegate to it.

`server/utils/workbench.ts` — the shared handler:

```ts
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/nuxt";

const emailQueue = new Queue("email", {
  connection: { url: process.env.REDIS_URL! },
});

export const workbenchHandler = workbench({
  queues: [emailQueue],
  basePath: "/jobs",
  auth: {
    username: process.env.WORKBENCH_USER!,
    password: process.env.WORKBENCH_PASS!,
  },
});
```

`server/routes/jobs.ts` — handles `/jobs` and `/jobs/`:

```ts
import { workbenchHandler } from "../utils/workbench";
export default workbenchHandler;
```

`server/routes/jobs/[...].ts` — handles `/jobs/<anything>`:

```ts
import { workbenchHandler } from "../../utils/workbench";
export default workbenchHandler;
```

> `basePath` must match the route file's directory so the dashboard's
> `<base href>` and internal routing line up with Nuxt's URL.

> The CLI scaffolds all three files for you — run
> `npx @getworkbench/cli init` inside your Nuxt app.

Visit `http://localhost:3000/jobs`.

> Note: Nuxt doesn't host long-running BullMQ workers in its server runtime
> by default — run them in a sibling Node process. See `examples/with-nuxt/`
> for a reference.

## Requirements

- Node 18+
- Nuxt 3+ (built on h3 / Nitro)
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
