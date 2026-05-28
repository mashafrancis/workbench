<p align="center">
  <a href="https://getworkbench.dev">
    <img src="https://raw.githubusercontent.com/pontusab/workbench/main/hero.png" alt="Workbench — the missing dashboard for BullMQ" />
  </a>
</p>

# @getworkbench/express

Express adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Node apps.

Mounts as a route in your existing Express app. No separate service.

## Migrating from bull-board?

Replace `@bull-board/express` with `@getworkbench/express` — same Redis, same queues, no schema change. Remove the old bull-board mount, then run `npx @getworkbench/cli init` or follow the install steps below.

Full comparison: [Workbench vs Bull Board](https://getworkbench.dev/blog/workbench-vs-bull-board)

## Install

```bash
npm i @getworkbench/express bullmq express
```

Or with the CLI:

```bash
npx @getworkbench/cli init
```

## Usage

```ts
import express from "express";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/express";

const app = express();
const emailQueue = new Queue("email", {
  connection: { url: process.env.REDIS_URL! },
});

app.use(
  "/jobs",
  workbench({
    queues: [emailQueue],
    auth: {
      username: process.env.WORKBENCH_USER!,
      password: process.env.WORKBENCH_PASS!,
    },
  }),
);

app.listen(3000);
```

Visit `http://localhost:3000/jobs`.

## Requirements

- Node 18+
- Express 4 or 5
- TypeScript 4.x or 5.x (no specific minimum)

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
