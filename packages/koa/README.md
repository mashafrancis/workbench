<p align="center">
  <a href="https://getworkbench.dev">
    <img src="https://raw.githubusercontent.com/pontusab/workbench/main/hero.png" alt="Workbench — the missing dashboard for BullMQ" />
  </a>
</p>

# @getworkbench/koa

Koa adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Node apps.

Mounts as a single middleware on your existing Koa app. No separate service.

## Migrating from bull-board?

Replace `@bull-board/koa` with `@getworkbench/koa` — same Redis, same queues, no schema change. Remove the old bull-board mount, then run `npx @getworkbench/cli init` or follow the install steps below.

Full comparison: [Workbench vs Bull Board](https://getworkbench.dev/blog/workbench-vs-bull-board)

## Install

```bash
npm i @getworkbench/koa bullmq koa
```

Or with the CLI:

```bash
npx @getworkbench/cli init
```

## Usage

```ts
import Koa from "koa";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/koa";

const app = new Koa();
const emailQueue = new Queue("email", {
  connection: { url: process.env.REDIS_URL! },
});

app.use(
  workbench({
    queues: [emailQueue],
    basePath: "/jobs",
    auth: {
      username: process.env.WORKBENCH_USER!,
      password: process.env.WORKBENCH_PASS!,
    },
  }),
);

app.listen(3000);
```

Visit `http://localhost:3000/jobs`.

> Koa has no built-in router or mount helper, so `basePath` is required. The
> middleware does its own prefix matching and passes non-dashboard requests
> through to the next middleware unchanged.

## Requirements

- Node 18+
- Koa 2.14+
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
