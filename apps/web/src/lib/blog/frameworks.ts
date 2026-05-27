import {
  AdonisLogo,
  AstroLogo,
  BunLogo,
  ElysiaLogo,
  ExpressLogo,
  FastifyLogo,
  H3Logo,
  HonoLogo,
  KoaLogo,
  NestjsLogo,
  NextLogo,
  NuxtLogo,
  TanstackStartLogo,
} from "../../components/logos";
import type { FrameworkMeta } from "./types";

/**
 * Source of truth for everything per-framework that shows up in the blog.
 * Anything you change here propagates through every post hero, code sample,
 * install command, and the bull-board comparison table.
 *
 * Code samples deliberately mount Workbench at `/jobs` to match the default
 * in our examples + CLI scaffolder, so a reader who copies the snippet ends
 * up at the same URL the rest of the docs talk about.
 *
 * `flavor` is the post-intro line we tack onto the "Workbench now supports X"
 * sentence. Keep it to one clause that says *why this framework matters*, not
 * what Workbench does — otherwise every post reads identically.
 */
export const FRAMEWORKS: Record<string, FrameworkMeta> = {
  hono: {
    slug: "hono",
    name: "Hono",
    homepage: "https://hono.dev",
    flavor:
      "the edge-ready Web-Standard router that runs everywhere from Cloudflare Workers to Bun",
    mountSurface: "Hono app",
    Logo: HonoLogo,
    codeSample: `import { Hono } from "hono";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/hono";

const emails = new Queue("emails");
const billing = new Queue("billing");

const app = new Hono();
app.route("/jobs", workbench({ queues: [emails, billing] }));

export default app;`,
  },

  elysia: {
    slug: "elysia",
    name: "Elysia",
    homepage: "https://elysiajs.com",
    flavor:
      "the Bun-native framework with end-to-end type inference and a built-in dev story",
    mountSurface: "Elysia app",
    Logo: ElysiaLogo,
    codeSample: `import { Elysia } from "elysia";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/elysia";

const emails = new Queue("emails");

new Elysia()
  .mount(
    "/jobs",
    workbench({ queues: [emails], basePath: "/jobs" }),
  )
  .listen(3000);`,
  },

  express: {
    slug: "express",
    name: "Express",
    homepage: "https://expressjs.com",
    flavor:
      "the most-deployed Node web framework on earth and the one your existing app probably runs on",
    mountSurface: "Express app",
    Logo: ExpressLogo,
    codeSample: `import express from "express";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/express";

const emails = new Queue("emails");

const app = express();
app.use("/jobs", workbench({ queues: [emails] }));
app.listen(3000);`,
  },

  fastify: {
    slug: "fastify",
    name: "Fastify",
    homepage: "https://fastify.dev",
    flavor:
      "the low-overhead JSON pipeline with first-class schemas and one of the fastest routers in Node",
    mountSurface: "Fastify instance",
    Logo: FastifyLogo,
    codeSample: `import Fastify from "fastify";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/fastify";

const emails = new Queue("emails");

const app = Fastify();
await app.register(workbench({ queues: [emails] }), {
  prefix: "/jobs",
});

await app.listen({ port: 3000 });`,
  },

  nestjs: {
    slug: "nestjs",
    name: "NestJS",
    homepage: "https://nestjs.com",
    flavor:
      "the structured TypeScript framework with DI, modules, and a thriving enterprise ecosystem",
    mountSurface: "Nest application",
    Logo: NestjsLogo,
    codeSample: `import { NestFactory } from "@nestjs/core";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/nestjs";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const emails = new Queue("emails");

  await workbench(app, "/jobs", { queues: [emails] });
  await app.listen(3000);
}

bootstrap();`,
  },

  next: {
    slug: "next",
    name: "Next.js",
    homepage: "https://nextjs.org",
    flavor:
      "the full-stack React framework that ships your dashboard alongside the rest of your product",
    mountSurface: "app/jobs/[[...workbench]]/route.ts",
    Logo: NextLogo,
    codeSample: `// app/jobs/[[...workbench]]/route.ts
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/next";

const emails = new Queue("emails");

export const { GET, POST, PUT, PATCH, DELETE } = workbench({
  queues: [emails],
  basePath: "/jobs",
});`,
  },

  adonis: {
    slug: "adonis",
    name: "AdonisJS",
    homepage: "https://adonisjs.com",
    flavor:
      "the structured TypeScript framework with IoC, first-class HTTP routing, and a thriving enterprise ecosystem on Node",
    mountSurface: "start/routes.ts",
    Logo: AdonisLogo,
    publishedAt: "2026-05-27",
    codeSample: `// start/routes.ts
import router from "@adonisjs/core/services/router";
import { Queue } from "bullmq";
import { mountWorkbench } from "@getworkbench/adonis";

const emails = new Queue("emails");

mountWorkbench(router, "/jobs", {
  queues: [emails],
  auth: {
    username: process.env.WORKBENCH_USER!,
    password: process.env.WORKBENCH_PASS!,
  },
});`,
  },

  "tanstack-start": {
    slug: "tanstack-start",
    name: "TanStack Start",
    homepage: "https://tanstack.com/start",
    flavor:
      "the full-stack React framework from TanStack with file-based server routes and a Vite-powered production build",
    mountSurface: "src/routes/jobs/$.ts",
    Logo: TanstackStartLogo,
    publishedAt: "2026-05-27",
    codeSample: `// src/routes/jobs/$.ts
import { createFileRoute } from "@tanstack/react-router";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/tanstack-start";

const emails = new Queue("emails");

export const Route = createFileRoute("/jobs/$")({
  server: {
    handlers: workbench({
      queues: [emails],
      basePath: "/jobs",
      auth: {
        username: process.env.WORKBENCH_USER!,
        password: process.env.WORKBENCH_PASS!,
      },
    }),
  },
});

// Also register the same handlers at src/routes/jobs.ts for /jobs and /jobs/.`,
  },

  koa: {
    slug: "koa",
    name: "Koa",
    homepage: "https://koajs.com",
    flavor:
      "the minimalist async-first middleware engine from the team that built Express",
    mountSurface: "Koa app",
    Logo: KoaLogo,
    codeSample: `import Koa from "koa";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/koa";

const emails = new Queue("emails");

const app = new Koa();
app.use(
  workbench({ queues: [emails], basePath: "/jobs" }),
);

app.listen(3000);`,
  },

  astro: {
    slug: "astro",
    name: "Astro",
    homepage: "https://astro.build",
    flavor:
      "the content-first framework that grew a real server runtime and a sharp opinion on islands",
    mountSurface: "src/pages/jobs/[...workbench].ts",
    Logo: AstroLogo,
    codeSample: `// src/pages/jobs/[...workbench].ts
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/astro";

const emails = new Queue("emails");

export const { GET, POST, PUT, PATCH, DELETE, prerender } = workbench({
  queues: [emails],
  basePath: "/jobs",
});

// In astro.config.* set: output: "server" (and disable checkOrigin).`,
  },

  nuxt: {
    slug: "nuxt",
    name: "Nuxt",
    homepage: "https://nuxt.com",
    flavor:
      "the Vue meta-framework powered by Nitro, with first-class server routes built in",
    mountSurface: "server/routes/jobs/[...].ts",
    Logo: NuxtLogo,
    codeSample: `// server/routes/jobs/[...].ts
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/nuxt";

const emails = new Queue("emails");

export default workbench({
  queues: [emails],
  basePath: "/jobs",
});`,
  },

  bun: {
    slug: "bun",
    name: "Bun",
    homepage: "https://bun.sh",
    flavor:
      "the all-in-one JavaScript runtime with a native HTTP server and a built-in package manager",
    mountSurface: "Bun.serve fetch handler",
    Logo: BunLogo,
    codeSample: `import { Queue } from "bullmq";
import { workbench } from "@getworkbench/bun";

const emails = new Queue("emails");

const dashboard = workbench({
  queues: [emails],
  basePath: "/jobs",
});

Bun.serve({
  port: 3000,
  fetch(req) {
    return dashboard(req, () => new Response("Hello, Bun!"));
  },
});`,
  },

  h3: {
    slug: "h3",
    name: "h3",
    homepage: "https://h3.dev",
    flavor:
      "the minimal HTTP framework powering Nitro, SolidStart, Analog, and a growing slice of the unjs world",
    mountSurface: "h3 app",
    Logo: H3Logo,
    codeSample: `import { createApp, toNodeListener } from "h3";
import { createServer } from "node:http";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/h3";

const emails = new Queue("emails");

const dashboard = workbench({
  queues: [emails],
  basePath: "/jobs",
});

const app = createApp();
app.use("/jobs", dashboard);
app.use("/jobs/**", dashboard);

createServer(toNodeListener(app)).listen(3000);`,
  },
};

/** Stable ordering used by the blog index, marquee, etc. */
export const FRAMEWORK_ORDER = [
  "hono",
  "elysia",
  "express",
  "fastify",
  "nestjs",
  "adonis",
  "next",
  "tanstack-start",
  "koa",
  "astro",
  "nuxt",
  "bun",
  "h3",
] as const;
