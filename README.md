# Workbench

Open-source BullMQ dashboard. Drop-in for any Node backend.

Workbench is a modern dashboard for [BullMQ](https://docs.bullmq.io/). Runs jobs, flows, schedulers and metrics, all served from your own backend behind your own auth.

- Zero infrastructure — mounts as a route in your existing Hono app
- Flows & DAG view, metrics, schedulers, search
- Dark-mode UI, basic-auth-protected by default
- MIT licensed

Website: [getworkbench.dev](https://getworkbench.dev)

## Quick start

```bash
npx @getworkbench/cli init
```

The CLI detects your Hono project, installs `@getworkbench/hono`, injects the mount, writes `.env.example` entries, and optionally drops a `docker-compose.yml` for Redis.

## Manual setup

```bash
npm i @getworkbench/hono bullmq hono
```

```ts
import { Hono } from "hono";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/hono";

const app = new Hono();
const emailQueue = new Queue("email", { connection: { url: process.env.REDIS_URL! } });

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

## Configuration

| Option     | Type                                | Description                                                |
| ---------- | ----------------------------------- | ---------------------------------------------------------- |
| `queues`   | `Queue[]`                           | BullMQ `Queue` instances to display. Required.             |
| `auth`     | `{ username, password }`            | Basic auth credentials. Strongly recommended in prod.      |
| `title`    | `string`                            | Dashboard title. Default: `"Workbench"`.                   |
| `logo`     | `string`                            | Logo URL to display in the nav.                            |
| `basePath` | `string`                            | Override base path detection.                              |
| `readonly` | `boolean`                           | Disable actions (retry, remove, promote).                  |
| `tags`     | `string[]`                          | Fields from `job.data` to extract as filterable tags.      |

## Packages

| Package                                                 | Description                  |
| ------------------------------------------------------- | ---------------------------- |
| [`@getworkbench/core`](./packages/core)                 | Core + API router + UI       |
| [`@getworkbench/hono`](./packages/hono)                 | Hono adapter                 |
| [`@getworkbench/cli`](./packages/cli)                   | `npx @getworkbench/cli init` |

Express, Fastify, Next.js and [Hyper](https://hyperjs.ai) adapters are planned for 0.2.

## FAQ

**Is it BullMQ-only?** Yes. Bull (legacy) is not supported.

**What Node version?** 18+.

**Can I run it without auth?** Yes, omit the `auth` option. Don't do that in production.

**Does it require a separate service?** No. It mounts as a route in your existing backend.

## Development

```bash
bun i
bun run build
bun run typecheck
```

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT © [Pontus Abrahamsson](https://github.com/pontusab)
