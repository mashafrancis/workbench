/**
 * Source of truth for the "Workbench vs bull-board" comparison surfaced on
 * the homepage, in every framework announcement, and as a standalone post.
 *
 * Keep it factual. Bull Board is a fine project and the alternative everyone
 * already knows about — the comparison earns trust only if every row is
 * defensible. When in doubt, link to evidence rather than making a stronger
 * claim than the codebase actually supports.
 *
 * Status legend:
 *   "yes"     — supported out of the box
 *   "partial" — possible but requires extra work / community plugin
 *   "no"      — not supported
 *   string    — qualitative answer (e.g. version compatibility)
 */
export type ComparisonStatus = "yes" | "partial" | "no";

export interface ComparisonRow {
  feature: string;
  /** One-sentence amplification shown under the row title on mobile. */
  note?: string;
  workbench: ComparisonStatus | string;
  bullBoard: ComparisonStatus | string;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Native desktop app",
    note: "Local-first inspector you launch from Spotlight, no server changes.",
    workbench: "yes",
    bullBoard: "no",
  },
  {
    feature: "Drop-in dashboard for your server",
    note: "Mount the same UI inside your existing Node app.",
    workbench: "yes",
    bullBoard: "yes",
  },
  {
    feature: "Officially supported frameworks",
    workbench:
      "Hono, Elysia, Express, Fastify, NestJS, AdonisJS, Next.js, TanStack Start, Koa, Astro, Nuxt, Bun, h3",
    bullBoard: "Express, Fastify, Hapi, Koa (community Next.js wrappers)",
  },
  {
    feature: "One-command install",
    note: "Auto-detects your framework and injects the mount for you.",
    workbench: "npx @getworkbench/cli init",
    bullBoard: "no",
  },
  {
    feature: "FlowProducer DAG visualisation",
    note: "Parent / child flows rendered as a real graph, not a flat list.",
    workbench: "yes",
    bullBoard: "partial",
  },
  {
    feature: "Live counters + p50 / p95 latency",
    note: "Per-queue throughput sparklines, updated as workers move jobs.",
    workbench: "yes",
    bullBoard: "partial",
  },
  {
    feature: "Error triage grouped by class",
    note: "Failures clustered with 24h trend lines so you spot regressions fast.",
    workbench: "yes",
    bullBoard: "no",
  },
  {
    feature: "Enqueue jobs from the UI",
    note: "Schema-aware payload editor, ⌘↵ to dispatch.",
    workbench: "yes",
    bullBoard: "partial",
  },
  {
    feature: "Open failed jobs in your editor",
    note: "Click a stack-trace line, jump to Cursor / VS Code.",
    workbench: "yes",
    bullBoard: "no",
  },
  {
    feature: "Keyboard-driven UI",
    note: "⌘K palette, single-key actions, no menu hunting.",
    workbench: "yes",
    bullBoard: "no",
  },
  {
    feature: "Light + dark themes",
    workbench: "yes",
    bullBoard: "yes",
  },
  {
    feature: "BullMQ Pro support",
    workbench: "yes",
    bullBoard: "yes",
  },
  {
    feature: "Open source, MIT-licensed",
    workbench: "yes",
    bullBoard: "yes",
  },
];

/**
 * Q&A for the bull-board comparison post.
 *
 * Surfaced both as a visible "Frequently asked questions" section at the
 * bottom of the post body *and* as `FAQPage` JSON-LD attached to the page.
 * The visible/structured pair is what AI search engines actually reward:
 * Google's spam policy requires the Q&A be visible if you mark it up, and
 * Perplexity / ChatGPT extract the verbatim answers from JSON-LD when they
 * cite the page.
 *
 * Answers are written as self-contained statements (40–80 words each) so
 * they're directly quotable as a snippet without needing surrounding
 * context — the same pattern as a featured-snippet answer block.
 */
export const COMPARISON_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "What is the best alternative to bull-board?",
    answer:
      "Workbench is the modern open-source alternative to bull-board for BullMQ. It ships first-party adapters for thirteen Node.js frameworks (Hono, Elysia, Express, Fastify, NestJS, AdonisJS, Next.js, TanStack Start, Koa, Astro, Nuxt, Bun, and h3), adds a native macOS desktop app for local-first inspection, and includes FlowProducer DAG visualisation, error triage grouped by exception class, and a scheduler timeline — features bull-board does not ship out of the box.",
  },
  {
    question: "Does Workbench work with the same BullMQ version as bull-board?",
    answer:
      "Yes. Workbench reads from the same Redis your workers already use, so it works with any BullMQ version that ships modern Queue and FlowProducer APIs. There is no separate Redis instance, no migration step, and no schema change — the dashboard simply attaches to your existing queues.",
  },
  {
    question: "Is Workbench open source and free?",
    answer:
      "Workbench is MIT-licensed and free. Both the desktop app and every @getworkbench/* framework adapter are open source on GitHub at github.com/pontusab/workbench. There is no paid tier, no telemetry, and no account required.",
  },
  {
    question: "Which frameworks does Workbench support?",
    answer:
      "Workbench ships first-party adapters for Hono, Elysia, Express, Fastify, NestJS, AdonisJS, Next.js, TanStack Start, Koa, Astro, Nuxt, Bun (Bun.serve), and h3. Each adapter is published as @getworkbench/<framework> on npm and ships with a runnable example in the monorepo. bull-board officially supports Express, Fastify, Hapi, and Koa.",
  },
  {
    question: "How do I install Workbench in my existing Node.js app?",
    answer:
      "Run `npx @getworkbench/cli init` from your project root. The CLI auto-detects your framework, installs the matching @getworkbench/* adapter, and injects the mount call into your server bootstrap. Visit `/jobs` after restarting and the dashboard renders with every Queue you passed in.",
  },
  {
    question: "How do I migrate from bull-board to Workbench?",
    answer:
      "Remove the @bull-board/* packages and the existing mount call, then run `npx @getworkbench/cli init`. Pass the same Queue instances you previously passed to bull-board. If you had basic auth in front of bull-board, the CLI offers to wire equivalent auth for Workbench. Migration is normally a five-minute change.",
  },
  {
    question: "Does Workbench support FlowProducer and BullMQ Pro?",
    answer:
      "Yes. Workbench renders FlowProducer parent / child relationships as a real DAG (not a flat list), with per-node duration and status, and supports drilling into subtrees and replaying nodes. BullMQ Pro is supported in both the desktop app and the embedded server dashboard.",
  },
];

/**
 * The "headline" trade-offs we surface in every framework announcement, in
 * one place so each post stays consistent and updates with the codebase.
 */
export const BULL_BOARD_HEADLINES = [
  {
    title: "A native desktop app, not just an embeddable UI",
    body: "Bull Board is a server-side dashboard you mount into your app. Workbench is both — embed it into your server (same one-liner) or run the native macOS app pointed at your Redis URL with zero server changes.",
  },
  {
    title: "Wider framework coverage, with first-party adapters",
    body: "Bull Board ships adapters for Express, Fastify, Hapi, and Koa. Workbench adds Hono, Elysia, NestJS, AdonisJS, Next.js, TanStack Start, Astro, Nuxt, Bun.serve, and h3 — thirteen officially-supported integrations, each with a smoke-tested example app.",
  },
  {
    title: "Built for production triage, not just queue inspection",
    body: "Error grouping with 24h trend lines, FlowProducer DAGs, scheduler timelines, p50/p95 latency, and ⌘-click to jump from a failed job's stack trace into Cursor or VS Code. The UI is keyboard-driven end-to-end.",
  },
  {
    title: "One command to wire it up",
    body: "`npx @getworkbench/cli init` detects your framework, installs the right adapter, and injects the mount — including the basic-auth boilerplate. Same install regardless of whether you're on Express or Nuxt.",
  },
];
