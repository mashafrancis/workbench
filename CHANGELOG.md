# Changelog

All notable changes to Workbench will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-05-24

### Added

- `@getworkbench/elysia` — Elysia adapter. Mounts via `.mount(path, workbench({ basePath, queues, auth }))`.
- `@getworkbench/express` — Express adapter. Returns an `express.Router` for `app.use(path, …)`.
- `@getworkbench/fastify` — Fastify v5 plugin. Registers via `app.register(workbench({…}), { prefix })`.
- `@getworkbench/next` — Next.js App Router adapter. Catch-all route exports `{ GET, POST, PUT, PATCH, DELETE }`.
- `@getworkbench/nestjs` — NestJS adapter. Single `await workbench(app, path, options)` call. Detects Express vs Fastify platform and wires the right adapter automatically.
- `buildRouteTable`, `createFetchHandler`, `buildWorkbenchApp`, `resolveBasePath`, `checkBasicAuth`, `serveStaticAsset`, and `renderIndexHtml` exports on `@getworkbench/core` so framework adapters can compose Workbench without re-implementing routing.
- `examples/with-elysia`, `examples/with-express`, `examples/with-fastify`, `examples/with-next`, `examples/with-nestjs` — each fully runnable with a single command, including an in-process worker that produces and consumes jobs so the dashboard is never empty.
- Root `docker-compose.yml` for a shared Redis instance.
- `scripts/smoke.ts` end-to-end smoke tests, wired up as `bun run smoke`. Boots every example, asserts `/api/overview`, `/api/queues`, and `<base href>` on `/` and a deep client route.
- CLI auto-detects Hono, Elysia, Express, Fastify, NestJS, and Next.js projects. For Next.js the CLI scaffolds the catch-all route file; for the others it edits the entry file in place.

### Changed

- `@getworkbench/hono` is now a thin wrapper around the framework-agnostic core (`buildWorkbenchApp`). No behavior change for existing consumers.
- Removed the "planned for 0.2" placeholder from the README; the new adapters are first-class.

## [0.1.0] - 2026-05-24

Initial public release.

### Added

- `@getworkbench/core` — `WorkbenchCore`, `QueueManager`, API router and bundled React UI.
- `@getworkbench/hono` — Hono adapter with basic-auth support.
- `@getworkbench/cli` — `npx @getworkbench/cli init` scaffolds Workbench into an existing Hono project.
- Flows & DAG view, 24h metrics, 7-day activity timeline, schedulers, search with `field:value` syntax.
- Bulk actions (retry, delete, promote).
