<p align="center">
  <a href="https://getworkbench.dev">
    <img src="https://raw.githubusercontent.com/pontusab/workbench/main/hero.png" alt="Workbench — the missing dashboard for BullMQ" />
  </a>
</p>

# @getworkbench/core

Core of [Workbench](https://getworkbench.dev) — `QueueManager`, API router, and bundled React UI.

This package is framework-agnostic. You typically don't depend on it directly — use a framework adapter instead:

| Adapter | Package |
| ------- | ------- |
| Hono | [`@getworkbench/hono`](https://npm.im/@getworkbench/hono) |
| Elysia | [`@getworkbench/elysia`](https://npm.im/@getworkbench/elysia) |
| Express | [`@getworkbench/express`](https://npm.im/@getworkbench/express) |
| Fastify | [`@getworkbench/fastify`](https://npm.im/@getworkbench/fastify) |
| NestJS | [`@getworkbench/nestjs`](https://npm.im/@getworkbench/nestjs) |
| AdonisJS | [`@getworkbench/adonis`](https://npm.im/@getworkbench/adonis) |
| Next.js | [`@getworkbench/next`](https://npm.im/@getworkbench/next) |
| TanStack Start | [`@getworkbench/tanstack-start`](https://npm.im/@getworkbench/tanstack-start) |
| Koa | [`@getworkbench/koa`](https://npm.im/@getworkbench/koa) |
| Astro | [`@getworkbench/astro`](https://npm.im/@getworkbench/astro) |
| Nuxt | [`@getworkbench/nuxt`](https://npm.im/@getworkbench/nuxt) |
| h3 | [`@getworkbench/h3`](https://npm.im/@getworkbench/h3) |
| Bun.serve | [`@getworkbench/bun`](https://npm.im/@getworkbench/bun) |

Or scaffold with the CLI:

```bash
npx @getworkbench/cli init
```

## What's inside

- `WorkbenchCore` — orchestrates queues, flows, schedulers, metrics, and search.
- `QueueManager` — wraps your BullMQ `Queue` instances and powers list / detail / mutation endpoints.
- **Overview dashboard** — fleet KPI cards, 24h throughput chart, attention alerts, and per-queue health cards (default home at `/`).
- **Redis auto-discovery** — pass a `redis` connection instead of explicit `Queue[]` instances; scans BullMQ keys via `discoverQueues()` and `WorkbenchCore.fromOptions()`.
- HTTP-agnostic API router — handles `/api/*` requests for the dashboard.
- Bundled UI — pre-built React app served as a single HTML entrypoint.

## Migrating from bull-board?

Workbench is the modern alternative to `@bull-board/api` + `@bull-board/ui`. Same Redis, same queues — swap the mount and keep your workers unchanged. See the [full comparison](https://getworkbench.dev/blog/workbench-vs-bull-board) or run `npx @getworkbench/cli init`.

## Install

```bash
npm i @getworkbench/core bullmq ioredis
```

## Direct usage (advanced)

Most users should reach for an adapter. If you need to wire Workbench into an unsupported framework, use one of two integration paths:

**Fetch-native runtimes** (Next.js, Elysia, Bun.serve, Adonis, …) — `createFetchHandler` returns a web-standard `(req: Request) => Response` handler:

```ts
import { Queue } from "bullmq";
import { createFetchHandler } from "@getworkbench/core";

const emailQueue = new Queue("email", {
  connection: { url: process.env.REDIS_URL! },
});

const { fetch } = createFetchHandler({
  queues: [emailQueue],
  basePath: "/jobs",
  auth: {
    username: process.env.WORKBENCH_USER!,
    password: process.env.WORKBENCH_PASS!,
  },
});

// Wire `fetch` into your framework's request handler.
```

**Node HTTP frameworks** (Express, Fastify, …) — use `buildRouteTable` + `renderIndexHtml` / `serveStaticAsset` directly. See `@getworkbench/express` or `@getworkbench/fastify` for the pattern.

**Auto-discovery** — omit `queues` and pass `redis` instead:

```ts
import { WorkbenchCore } from "@getworkbench/core";

const core = await WorkbenchCore.fromOptions({
  redis: process.env.REDIS_URL!,
  prefix: "bull", // optional, default "bull"
  maxQueues: 100, // optional cap for large deployments
});
```

## Entry points

| Entry | Purpose |
| ----- | ------- |
| `@getworkbench/core` | Framework-agnostic surface: `WorkbenchCore`, `discoverQueues`, `buildRouteTable`, `createFetchHandler`, types, basic auth + static helpers. |
| `@getworkbench/core/hono` | `buildWorkbenchApp`, `buildWorkbenchApiApp`, `createApiRoutes` — anything that returns a `Hono` instance. |
| `@getworkbench/core/ui` | React `Dashboard` component for embedding the dashboard inside a host Vite/React app. Also exports `createAppRouter`, `setApiBase`, and `getConfigUrl`. |
| `@getworkbench/core/ui/styles.css` | Tailwind-generated stylesheet that ships with the dashboard. |

The Hono-typed helpers live on a dedicated subpath so non-Hono adapters (Express, Fastify, NestJS, Next.js, Elysia) don't drag `hono`'s `.d.ts` into the consumer's TypeScript program. That `.d.ts` uses TypeScript 5.0 syntax (`const` type parameters) and isolating it lets TS 4.x users keep building.

## Options

Shared by every adapter and by `createFetchHandler` / `WorkbenchCore`:

| Option | Type | Description |
| ------ | ---- | ----------- |
| `queues` | `Queue[]` | BullMQ `Queue` instances to display. Required unless `redis` is set. |
| `redis` | `string \| RedisOptions` | Redis connection for auto-discovery when `queues` is omitted. |
| `prefix` | `string` | BullMQ key prefix used during auto-discovery. Default: `"bull"`. |
| `maxQueues` | `number` | Cap on discovered queues for large deployments. Default: `100`. |
| `auth` | `{ username, password }` | Basic auth credentials. Strongly recommended in prod. |
| `title` | `string` | Dashboard title. Default: `"Workbench"`. |
| `logo` | `string` | Logo URL to display in the nav. |
| `basePath` | `string` | Override base path detection. Required for some adapters (Elysia, Koa, Next.js, TanStack Start, Astro, Nuxt, h3, Adonis). |
| `readonly` | `boolean` | Disable actions (retry, remove, promote). |
| `tags` | `string[]` | Fields from `job.data` to extract as filterable tags. |

## Requirements

- Node 18+ (or Bun 1.1+ for the Elysia and Bun.serve adapters)
- TypeScript 4.x or 5.x for the main entry. **TypeScript 5.0+ required if you import from `@getworkbench/core/hono`** — Hono 4's bundled `.d.ts` uses TS 5.0 syntax (`const` type parameters).

## Documentation

[getworkbench.dev](https://getworkbench.dev) · [GitHub](https://github.com/pontusab/workbench)

## License

MIT
