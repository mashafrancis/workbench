<p align="center">
  <a href="https://getworkbench.dev">
    <img src="https://raw.githubusercontent.com/pontusab/workbench/main/hero.png" alt="Workbench — the missing dashboard for BullMQ" />
  </a>
</p>

# @getworkbench/astro

Astro adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Node apps.

Mounts as a single catch-all route in your existing Astro app. No separate service.

## Migrating from bull-board?

Workbench covers the same BullMQ use case with a modern UI, broader framework support, and a one-command install. Remove your `@bull-board/*` packages and run `npx @getworkbench/cli init`.

Full comparison: [Workbench vs Bull Board](https://getworkbench.dev/blog/workbench-vs-bull-board)

## Install

```bash
npm i @getworkbench/astro bullmq
```

Or with the CLI:

```bash
npx @getworkbench/cli init
```

## Usage

Astro must be in server output mode. In `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  output: "server", // or "hybrid"
  adapter: node({ mode: "standalone" }),
  // Astro 5's default CSRF protection (`security.checkOrigin`) blocks
  // non-browser POST/PUT/DELETE requests to the Workbench API. The dashboard
  // ships its own basic-auth, so disabling this for the dashboard route is
  // safe. Either disable globally:
  security: { checkOrigin: false },
  // …or keep it on globally and skip the check on the dashboard route via
  // an Astro middleware that early-returns for `/jobs/*` requests.
});
```

Then create a catch-all route at `src/pages/<mount>/[...workbench].ts`:

```ts
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/astro";

const emailQueue = new Queue("email", {
  connection: { url: process.env.REDIS_URL! },
});

export const { GET, POST, PUT, PATCH, DELETE, prerender } = workbench({
  queues: [emailQueue],
  basePath: "/jobs",
  auth: {
    username: process.env.WORKBENCH_USER!,
    password: process.env.WORKBENCH_PASS!,
  },
});
```

> `basePath` must match the route file's directory so the dashboard's
> `<base href>` and internal routing line up with Astro's URL.

Visit `http://localhost:4321/<mount>`.

> Note: Astro doesn't host BullMQ workers itself — run them in a sibling
> process. See `examples/with-astro/` for a reference.

## Requirements

- Node 18+
- Astro 3+ (in `server` or `hybrid` output mode)
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
