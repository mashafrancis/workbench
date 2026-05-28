<p align="center">
  <a href="https://getworkbench.dev">
    <img src="https://raw.githubusercontent.com/pontusab/workbench/main/hero.png" alt="Workbench — the missing dashboard for BullMQ" />
  </a>
</p>

# @getworkbench/adonis

AdonisJS adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Node apps.

Works with AdonisJS 6 and 7. Mounts as catch-all routes in your existing Adonis app.

## Migrating from bull-board?

Workbench covers the same BullMQ use case with a modern UI, broader framework support, and a one-command install. Remove your `@bull-board/*` packages and run `npx @getworkbench/cli init`.

Full comparison: [Workbench vs Bull Board](https://getworkbench.dev/blog/workbench-vs-bull-board)

## Install

```bash
npm i @getworkbench/adonis bullmq @adonisjs/core
```

Or with the CLI:

```bash
npx @getworkbench/cli init
```

## Usage

```ts
// start/routes.ts
import router from "@adonisjs/core/services/router";
import { Queue } from "bullmq";
import { mountWorkbench } from "@getworkbench/adonis";

const emails = new Queue("email", {
  connection: { url: process.env.REDIS_URL! },
});

mountWorkbench(router, "/jobs", {
  queues: [emails],
  auth: {
    username: process.env.WORKBENCH_USER!,
    password: process.env.WORKBENCH_PASS!,
  },
});
```

Visit `http://localhost:PORT/jobs`.

## Requirements

- Node 18+
- AdonisJS 6+ (`@adonisjs/core`)

## Documentation

[getworkbench.dev](https://getworkbench.dev) · [GitHub](https://github.com/pontusab/workbench)

## License

MIT
