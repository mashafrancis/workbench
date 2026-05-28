<p align="center">
  <a href="https://getworkbench.dev">
    <img src="https://raw.githubusercontent.com/pontusab/workbench/main/hero.png" alt="Workbench — the missing dashboard for BullMQ" />
  </a>
</p>

# @getworkbench/tanstack-start

TanStack Start adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Node apps.

Mounts on TanStack Start server routes using the web-standard `Request` / `Response` API.

## Migrating from bull-board?

Workbench covers the same BullMQ use case with a modern UI, broader framework support, and a one-command install. Remove your `@bull-board/*` packages and run `npx @getworkbench/cli init`.

Full comparison: [Workbench vs Bull Board](https://getworkbench.dev/blog/workbench-vs-bull-board)

## Install

```bash
npm i @getworkbench/tanstack-start bullmq @tanstack/react-start
```

Or with the CLI:

```bash
npx @getworkbench/cli init
```

## Usage

Register handlers on both the bare mount and the splat route:

```ts
// src/routes/jobs.ts
import { createFileRoute } from "@tanstack/react-router";
import { workbench } from "@getworkbench/tanstack-start";

export const Route = createFileRoute("/jobs")({
  server: {
    handlers: workbench({
      queues: [/* your BullMQ Queue instances */],
      basePath: "/jobs",
    }),
  },
});
```

```ts
// src/routes/jobs/$.ts
import { createFileRoute } from "@tanstack/react-router";
import { workbenchHandlers } from "../../lib/workbench-handlers";

export const Route = createFileRoute("/jobs/$")({
  server: { handlers: workbenchHandlers },
});
```

Visit `http://localhost:PORT/jobs`.

## Requirements

- Node 18+
- TanStack Start 1.120+ (`@tanstack/react-start`)
- Vite 7+ (as required by current TanStack Start releases)

## Documentation

[getworkbench.dev](https://getworkbench.dev) · [GitHub](https://github.com/pontusab/workbench)

## License

MIT
