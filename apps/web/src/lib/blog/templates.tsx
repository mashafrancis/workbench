import Link from "next/link";
import { CompareTable } from "../../components/blog/compare-table";
import { CodeBlock, Prose } from "../../components/blog/prose";
import { CopyCommand } from "../../components/copy-command";
import {
  BULL_BOARD_HEADLINES,
  COMPARISON_FAQ,
  COMPARISON_ROWS,
} from "./comparison";
import { MCP_FAQ } from "./mcp";
import type { FrameworkMeta } from "./types";

/**
 * Reusable body template for the per-framework announcement posts.
 *
 * Every framework post follows the same structure: short intro, install
 * command, mount-it code sample, "what you get" bullet list, "why not Bull
 * Board" callout with a compact comparison table, and a call-to-action.
 *
 * Sharing the template means a copy edit propagates to all framework posts at once,
 * and individual posts can't drift apart. The only per-framework variation
 * lives in `framework.flavor`, `framework.codeSample`, and a couple of small
 * one-liners — everything else comes from `comparison.ts`.
 */
export function FrameworkAnnouncementBody({
  framework,
}: {
  framework: FrameworkMeta;
}) {
  const cmd = `npx @getworkbench/cli init`;
  const adapterUrl = `https://www.npmjs.com/package/@getworkbench/${framework.slug}`;
  const exampleUrl = `https://github.com/pontusab/workbench/tree/main/examples/with-${framework.slug}`;
  const readmeUrl = `https://github.com/pontusab/workbench/tree/main/packages/${framework.slug}#readme`;

  return (
    <Prose>
      <p>
        Workbench now ships a first-party adapter for{" "}
        <a
          href={framework.homepage}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-[color:var(--color-border)] decoration-1 underline-offset-[6px] hover:decoration-[color:var(--color-foreground)]"
        >
          {framework.name}
        </a>{" "}
        — {framework.flavor}. Drop the same open-source BullMQ dashboard you
        already get on the desktop straight into your existing {framework.name}{" "}
        server, behind whatever auth and routing you already run.
      </p>

      <p>
        No new processes to manage, no parallel Redis connections, no copy of
        your queue config drifting out of sync. The dashboard reads from the
        same Redis your workers do, mounts at a path of your choice, and gets
        out of the way the rest of the time.
      </p>

      <SectionHeading>Install in your {framework.name} app</SectionHeading>

      <p>
        Run the CLI from your project root — it detects {framework.name},
        installs <Code>@getworkbench/{framework.slug}</Code>, and wires the
        mount into <Code>{framework.mountSurface}</Code> for you:
      </p>

      <div className="not-prose my-6">
        <CopyCommand command={cmd} variant="button" />
      </div>

      <p>
        Prefer to wire it up by hand? Install the adapter and add the snippet
        below to the file you already use for your {framework.name} server
        bootstrap:
      </p>

      <CodeBlock code={framework.codeSample} language="ts" />

      <p>
        That&apos;s the whole integration. Visit{" "}
        <Code>http://localhost:3000/jobs</Code> and the dashboard renders with
        every queue you passed in. The adapter is published as{" "}
        <a
          href={adapterUrl}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-[color:var(--color-border)] decoration-1 underline-offset-[6px] hover:decoration-[color:var(--color-foreground)]"
        >
          <Code>@getworkbench/{framework.slug}</Code>
        </a>{" "}
        and the runnable example lives at{" "}
        <a
          href={exampleUrl}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-[color:var(--color-border)] decoration-1 underline-offset-[6px] hover:decoration-[color:var(--color-foreground)]"
        >
          examples/with-{framework.slug}
        </a>{" "}
        in the repo.
      </p>

      <SectionHeading>What you get</SectionHeading>

      <ul className="not-prose my-6 space-y-2 pl-0">
        {[
          "Live counters, p50/p95 latency, and throughput sparklines per queue.",
          "Virtualised runs table with status filters, full payloads one click away, and keyboard-driven retry.",
          "FlowProducer DAG view for parent/child jobs, with per-node duration and status.",
          "Scheduler timeline for cron + delayed jobs — pause, resume, edit cron without a redeploy.",
          "Error triage grouped by exception class with 24h trend lines.",
          "Click any line in a failed job's stack trace to jump straight to Cursor or VS Code.",
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-[color:var(--color-foreground)]/60" />
            <span className="text-[15px] leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <SectionHeading>Why not bull-board for {framework.name}?</SectionHeading>

      <p>
        Bull Board is the dashboard most {framework.name} teams reach for first,
        and for plenty of projects it&apos;s fine. The three places Workbench
        tends to win are coverage, polish, and operations — here are the
        high-order bits:
      </p>

      <ul className="not-prose my-6 space-y-4">
        {BULL_BOARD_HEADLINES.slice(0, 3).map(({ title, body }) => (
          <li
            key={title}
            className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/20 p-5"
          >
            <div className="text-[15px] font-medium tracking-tight">
              {title}
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--color-muted-foreground)]">
              {body}
            </p>
          </li>
        ))}
      </ul>

      <p>
        The short version for {framework.name} users specifically: Bull Board
        does not ship an official {framework.name} adapter, so you&apos;d be on
        a community wrapper or bridging through Express. Workbench&apos;s{" "}
        <Code>@getworkbench/{framework.slug}</Code> is a first-party package
        with a smoke-tested example app and the same one-command installer as
        every other supported framework.
      </p>

      <div className="not-prose my-8">
        <CompareTable rows={COMPARISON_ROWS} compact />
      </div>

      <p>
        For the full side-by-side, see{" "}
        <Link
          href="/blog/workbench-vs-bull-board"
          className="underline decoration-[color:var(--color-border)] decoration-1 underline-offset-[6px] hover:decoration-[color:var(--color-foreground)]"
        >
          Workbench vs Bull Board
        </Link>
        .
      </p>

      <SectionHeading>Get started</SectionHeading>

      <p>
        Adapter docs and a complete runnable example live in the{" "}
        <a
          href={readmeUrl}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-[color:var(--color-border)] decoration-1 underline-offset-[6px] hover:decoration-[color:var(--color-foreground)]"
        >
          @getworkbench/{framework.slug} README
        </a>
        . If anything trips up, open an issue on{" "}
        <a
          href="https://github.com/pontusab/workbench"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-[color:var(--color-border)] decoration-1 underline-offset-[6px] hover:decoration-[color:var(--color-foreground)]"
        >
          GitHub
        </a>{" "}
        — every supported framework has a CI smoke test, so reproductions move
        fast.
      </p>

      <div className="not-prose mt-10 flex flex-col items-start gap-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/30 p-6 md:p-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
          Install
        </div>
        <div className="text-xl font-semibold tracking-tight md:text-2xl">
          Workbench for {framework.name}, one command.
        </div>
        <CopyCommand command={cmd} variant="button" />
      </div>
    </Prose>
  );
}

/**
 * Body for the dedicated "Workbench vs Bull Board" comparison post. Pulls
 * from the same `COMPARISON_ROWS` array so every other place that surfaces
 * a comparison stays in lockstep with this page.
 */
export function BullBoardComparisonBody() {
  const cmd = `npx @getworkbench/cli init`;

  return (
    <Prose>
      <p>
        If you&apos;re running BullMQ in production and you&apos;ve typed
        &quot;bullmq dashboard&quot; into Google in the last two years, the
        first thing you found was{" "}
        <a
          href="https://github.com/felixmosh/bull-board"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-[color:var(--color-border)] decoration-1 underline-offset-[6px] hover:decoration-[color:var(--color-foreground)]"
        >
          Bull Board
        </a>
        . It&apos;s a great open-source project and the default choice for a lot
        of teams. This post is for the moment you outgrow it — or start from
        scratch and want to know what else is out there.
      </p>

      <p>
        We&apos;ll keep this honest. Bull Board is genuinely useful and the
        comparison below only highlights places Workbench solves a specific
        problem better. If your needs are exclusively in Bull Board&apos;s sweet
        spot — basic per-queue inspection inside an Express or Fastify app —
        there&apos;s nothing wrong with sticking with it.
      </p>

      <SectionHeading>The short version</SectionHeading>

      <ul className="not-prose my-6 space-y-4">
        {BULL_BOARD_HEADLINES.map(({ title, body }) => (
          <li
            key={title}
            className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/20 p-5"
          >
            <div className="text-[15px] font-medium tracking-tight">
              {title}
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--color-muted-foreground)]">
              {body}
            </p>
          </li>
        ))}
      </ul>

      <SectionHeading>Side-by-side</SectionHeading>

      <p>
        Every row below maps to behaviour you can verify against the public
        codebases. &quot;Limited&quot; means the capability exists in some form
        (plugin, manual config, third-party wrapper) but isn&apos;t a
        first-class feature.
      </p>

      <div className="not-prose my-8">
        <CompareTable rows={COMPARISON_ROWS} />
      </div>

      <SectionHeading>When Bull Board is the right call</SectionHeading>

      <p>
        Bull Board still wins for a handful of cases — being honest about that
        is what makes the rest of this comparison useful.
      </p>

      <ul className="not-prose my-6 space-y-2 pl-0">
        {[
          "Your app already runs Express or Fastify and you only need read-only queue inspection.",
          "You can't add a new dependency vendor and need a project with a long, well-known maintainer history.",
          "You already wrote tooling on top of Bull Board's API and a migration cost outweighs the upside.",
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-[color:var(--color-foreground)]/60" />
            <span className="text-[15px] leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <SectionHeading>When Workbench is the right call</SectionHeading>

      <ul className="not-prose my-6 space-y-2 pl-0">
        {[
          "You're on a framework Bull Board doesn't ship a first-party adapter for — Hono, Elysia, NestJS, AdonisJS, Next.js, TanStack Start, Astro, Nuxt, Bun, or h3.",
          "You want a local-first inspector you can run on your laptop without touching the server — point it at any Redis URL, get the dashboard.",
          "Your team triages production failures regularly and you want grouped errors, trend lines, and stack traces that open in your editor.",
          "You use FlowProducer and need a real DAG, not a flat list.",
          "You want one install command for every framework instead of a different setup per project.",
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-[color:var(--color-foreground)]/60" />
            <span className="text-[15px] leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <SectionHeading>Migrating from Bull Board</SectionHeading>

      <p>
        The two dashboards mount the same way — a single line in your server
        bootstrap. Migration is normally a five-minute job:
      </p>

      <ol className="not-prose my-6 list-decimal space-y-2 pl-6">
        {[
          "Remove @bull-board/* packages and the mount call.",
          "Run npx @getworkbench/cli init — it detects your framework and adds the right adapter.",
          "Pass the same Queue instances you were passing to Bull Board.",
          "If you were using basic auth in front of Bull Board, the CLI offers to wire the same thing for Workbench.",
        ].map((item) => (
          <li key={item} className="text-[15px] leading-relaxed">
            {item}
          </li>
        ))}
      </ol>

      <SectionHeading>Frequently asked questions</SectionHeading>

      {/*
        The visible Q&A here is the same content emitted as `FAQPage` JSON-LD
        in the post page. Both halves are required: Google's spam policy
        forbids FAQ schema without the same content rendered on the page,
        and Perplexity / ChatGPT / Claude extract verbatim answers from
        JSON-LD when they cite the page. Keep COMPARISON_FAQ in sync with
        whatever you actually want quoted in an AI answer.
      */}
      <dl className="not-prose my-6 divide-y divide-[color:var(--color-border)]/60 border-y border-[color:var(--color-border)]/60">
        {COMPARISON_FAQ.map(({ question, answer }) => (
          <div key={question} className="py-5">
            <dt className="text-[15px] font-medium tracking-tight text-[color:var(--color-foreground)]">
              {question}
            </dt>
            <dd className="mt-2 text-[14px] leading-relaxed text-[color:var(--color-muted-foreground)]">
              {answer}
            </dd>
          </div>
        ))}
      </dl>

      <div className="not-prose mt-10 flex flex-col items-start gap-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/30 p-6 md:p-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
          Try Workbench
        </div>
        <div className="text-xl font-semibold tracking-tight md:text-2xl">
          One command, thirteen frameworks.
        </div>
        <CopyCommand command={cmd} variant="button" />
      </div>
    </Prose>
  );
}

/**
 * Body for the @getworkbench/mcp launch post.
 *
 * Conceptually the same shape as the framework announcement template
 * (intro → install → what-you-get → why-it-matters → FAQ → CTA) but the
 * "install" surface is an MCP-client JSON config rather than a server
 * mount snippet, and "what you get" enumerates the 18 tools the MCP
 * exposes grouped by intent (inspect vs operate) so the LLM reading this
 * page can also use it as a reference card for the package itself.
 *
 * Like every other AI-SEO-tuned post, the FAQ block at the bottom is
 * what the page-level `FAQPage` JSON-LD points at — both halves must be
 * present and identical for the schema to be valid under Google's policy.
 */
export function McpAnnouncementBody() {
  const packageUrl = "https://www.npmjs.com/package/@getworkbench/mcp";
  const readmeUrl =
    "https://github.com/pontusab/workbench/tree/main/packages/mcp#readme";

  // Single source of truth for the JSON-RPC config block — kept here
  // rather than in a constants file because no other post needs it.
  const cursorConfig = `{
  "mcpServers": {
    "workbench": {
      "command": "npx",
      "args": ["-y", "@getworkbench/mcp"],
      "env": {
        "WORKBENCH_URL": "http://localhost:3000/jobs",
        "WORKBENCH_USERNAME": "admin",
        "WORKBENCH_PASSWORD": "hunter2"
      }
    }
  }
}`;

  const inspectTools = [
    {
      name: "workbench_get_overview",
      what: "Per-queue snapshot — names, paused state, count summary.",
    },
    {
      name: "workbench_list_queues",
      what: "Queues with full per-status counts.",
    },
    {
      name: "workbench_get_quick_counts",
      what: "Lightweight counts, cheap for polling.",
    },
    {
      name: "workbench_get_metrics",
      what: "Per-queue p50 / p95 latency and throughput.",
    },
    {
      name: "workbench_get_activity",
      what: "24h completed / failed buckets for the activity heatmap.",
    },
    {
      name: "workbench_list_jobs",
      what: "Jobs in a queue, status-filtered, paginated.",
    },
    {
      name: "workbench_list_runs",
      what: "Cross-queue runs with text, status, time, and tag filters.",
    },
    {
      name: "workbench_get_job",
      what: "Full payload + attempts + stack trace for one job.",
    },
    {
      name: "workbench_search_jobs",
      what: "Free-text search across job ids, names, and indexed tag values.",
    },
    {
      name: "workbench_list_schedulers",
      what: "Repeatable + delayed scheduler entries.",
    },
    {
      name: "workbench_list_flows",
      what: "Recent FlowProducer roots.",
    },
    {
      name: "workbench_get_flow",
      what: "Full DAG for a FlowProducer flow.",
    },
    {
      name: "workbench_list_tag_values",
      what: "Distinct values for a configured tag field.",
    },
  ];

  const operateTools = [
    { name: "workbench_retry_job", what: "Retry a single failed job." },
    { name: "workbench_remove_job", what: "Delete a job (any state)." },
    { name: "workbench_promote_job", what: "Force a delayed job to run now." },
    { name: "workbench_pause_queue", what: "Pause a queue." },
    { name: "workbench_resume_queue", what: "Resume a paused queue." },
    {
      name: "workbench_run_scheduler_now",
      what: "One-off trigger for a repeatable scheduler.",
    },
    { name: "workbench_enqueue_job", what: "Add a new job to a queue." },
    {
      name: "workbench_clean_jobs",
      what: "Bulk-remove completed or failed jobs.",
    },
    {
      name: "workbench_bulk_retry",
      what: "Retry many failed jobs in one call.",
    },
    {
      name: "workbench_bulk_delete",
      what: "Delete many jobs in one call.",
    },
  ];

  return (
    <Prose>
      <p>
        Workbench 0.5.1 ships{" "}
        <a
          href={packageUrl}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-[color:var(--color-border)] decoration-1 underline-offset-[6px] hover:decoration-[color:var(--color-foreground)]"
        >
          <Code>@getworkbench/mcp</Code>
        </a>{" "}
        — a{" "}
        <a
          href="https://modelcontextprotocol.io"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-[color:var(--color-border)] decoration-1 underline-offset-[6px] hover:decoration-[color:var(--color-foreground)]"
        >
          Model Context Protocol
        </a>{" "}
        server that lets Cursor, Claude Desktop, Zed, Continue.dev, and any
        other MCP-aware agent see, debug, and operate your BullMQ queues from
        the same chat box you already use for code.
      </p>

      <p>
        Workbench already gives developers a beautiful BullMQ dashboard. The MCP
        gives <em>agents</em> the same surface. Same data, same operations, same
        permissions — but reachable from your editor.
      </p>

      <SectionHeading>What it lets the agent do</SectionHeading>

      <p>Real prompts the MCP unlocks today:</p>

      <ul className="not-prose my-6 space-y-2 pl-0">
        {[
          "“Why is email-send backed up?” — the agent calls workbench_get_metrics, sees p95 latency spiked at 14:02, calls workbench_list_runs with status=failed and from=14:00, finds the regression in the stack trace.",
          "“Retry every failed webhook-deliver from the last hour.” — workbench_list_runs then workbench_bulk_retry.",
          "“Run the nightly billing scheduler now so I can verify the fix.” — workbench_list_schedulers then workbench_run_scheduler_now, the one-off trigger added in Workbench 0.5.0.",
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-[color:var(--color-foreground)]/60" />
            <span className="text-[15px] leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <SectionHeading>Install in 30 seconds</SectionHeading>

      <p>
        The MCP is a tiny <Code>npx</Code>-runnable binary — no global install,
        no port to manage. In Cursor, drop the following into{" "}
        <Code>~/.cursor/mcp.json</Code>:
      </p>

      <CodeBlock code={cursorConfig} language="json" />

      <p>
        Restart Cursor and the 18 <Code>workbench_*</Code> tools appear in the
        chat. The same pattern works for Claude Desktop, Zed, and Continue.dev
        with their respective config paths — full snippets for each editor live
        in the{" "}
        <a
          href={readmeUrl}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-[color:var(--color-border)] decoration-1 underline-offset-[6px] hover:decoration-[color:var(--color-foreground)]"
        >
          package README
        </a>
        .
      </p>

      <p>
        Only one env var is required: <Code>WORKBENCH_URL</Code>, pointing at
        the URL where you&apos;d open the dashboard in a browser.{" "}
        <Code>WORKBENCH_USERNAME</Code> + <Code>WORKBENCH_PASSWORD</Code> (or{" "}
        <Code>WORKBENCH_TOKEN</Code>) cover the same Basic Auth your dashboard
        was started with.
      </p>

      <SectionHeading>The 18 tools</SectionHeading>

      <p>
        Tools are grouped by intent and annotated so MCP clients know how to
        gate them. Inspect tools are tagged <Code>readOnlyHint: true</Code> so
        clients like Cursor can auto-approve them; operate tools are tagged{" "}
        <Code>destructiveHint: true</Code> so the user is prompted before each
        call.
      </p>

      <h3 className="mt-8 mb-3 text-base font-medium tracking-tight text-[color:var(--color-muted-foreground)]">
        Inspect (read-only)
      </h3>

      <dl className="not-prose my-4 divide-y divide-[color:var(--color-border)]/40 border-y border-[color:var(--color-border)]/40">
        {inspectTools.map(({ name, what }) => (
          <div
            key={name}
            className="flex flex-col gap-1 py-3 md:flex-row md:gap-6"
          >
            <dt className="font-mono text-[13px] text-[color:var(--color-foreground)] md:w-72 md:shrink-0">
              {name}
            </dt>
            <dd className="text-[14px] leading-relaxed text-[color:var(--color-muted-foreground)]">
              {what}
            </dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-8 mb-3 text-base font-medium tracking-tight text-[color:var(--color-muted-foreground)]">
        Operate (gated, prompts the user)
      </h3>

      <dl className="not-prose my-4 divide-y divide-[color:var(--color-border)]/40 border-y border-[color:var(--color-border)]/40">
        {operateTools.map(({ name, what }) => (
          <div
            key={name}
            className="flex flex-col gap-1 py-3 md:flex-row md:gap-6"
          >
            <dt className="font-mono text-[13px] text-[color:var(--color-foreground)] md:w-72 md:shrink-0">
              {name}
            </dt>
            <dd className="text-[14px] leading-relaxed text-[color:var(--color-muted-foreground)]">
              {what}
            </dd>
          </div>
        ))}
      </dl>

      <SectionHeading>How it works</SectionHeading>

      <p>
        The MCP is deliberately not a second connection to Redis. It speaks
        JSON-RPC over stdio to your editor (the standard MCP transport, what
        every client in the wild expects) and HTTP to your running Workbench
        dashboard — the dashboard is the one that owns the Redis connection, the
        auth, the readonly flag, and the queue config.
      </p>

      <pre className="not-prose my-6 overflow-x-auto rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/30 p-5 font-mono text-[12px] leading-relaxed text-[color:var(--color-muted-foreground)]">
        {`Cursor / Claude / Zed / Continue ─┐
                                         │  JSON-RPC (stdio)
                                         ▼
                                workbench-mcp
                                         │  HTTP + Basic Auth
                                         ▼
                              Workbench dashboard
                                         │  ioredis
                                         ▼
                                   Redis / BullMQ`}
      </pre>

      <p>
        That layering is the whole point of shipping this as an optional,
        separate package: no second source of truth for permissions, no parallel
        Redis pool to keep in sync, no duplicated business logic. If your
        dashboard is in <Code>readonly: true</Code>, every write tool returns a
        403 the agent can show you verbatim instead of silently mutating
        production.
      </p>

      <SectionHeading>
        Auth and readonly are inherited end-to-end
      </SectionHeading>

      <p>
        For unattended agents, run the dashboard with{" "}
        <Code>readonly: true</Code> and pass the MCP the same Basic Auth
        credentials. Every operate tool will refuse cleanly with an actionable
        error message; every inspect tool keeps working. For regular use, leave
        the dashboard as you already have it — the MCP will prompt before any
        destructive call thanks to the <Code>destructiveHint</Code> annotation.
      </p>

      <SectionHeading>Frequently asked questions</SectionHeading>

      {/*
        Mirror of the FAQPage JSON-LD emitted on the post page. Both
        halves must be present and identical: Google's spam policy
        rejects FAQ schema without visible Q&A, and Perplexity / ChatGPT
        / Claude lift verbatim answers from the JSON-LD when they cite.
        Keep MCP_FAQ in sync with whatever you actually want quoted.
      */}
      <dl className="not-prose my-6 divide-y divide-[color:var(--color-border)]/60 border-y border-[color:var(--color-border)]/60">
        {MCP_FAQ.map(({ question, answer }) => (
          <div key={question} className="py-5">
            <dt className="text-[15px] font-medium tracking-tight text-[color:var(--color-foreground)]">
              {question}
            </dt>
            <dd className="mt-2 text-[14px] leading-relaxed text-[color:var(--color-muted-foreground)]">
              {answer}
            </dd>
          </div>
        ))}
      </dl>

      <div className="not-prose mt-10 flex flex-col items-start gap-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/30 p-6 md:p-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
          Try it
        </div>
        <div className="text-xl font-semibold tracking-tight md:text-2xl">
          Bring your queues into your editor.
        </div>
        <CopyCommand command="npx -y @getworkbench/mcp" variant="button" />
        <div className="text-[13px] text-[color:var(--color-muted-foreground)]">
          Full setup snippets for Cursor, Claude Desktop, Zed, and Continue.dev
          in the{" "}
          <a
            href={readmeUrl}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-[color:var(--color-border)] decoration-1 underline-offset-[6px] hover:decoration-[color:var(--color-foreground)]"
          >
            package README
          </a>
          .
        </div>
      </div>
    </Prose>
  );
}

/* -------------------------------------------------------------------------- */
/* Internal building blocks                                                   */
/* -------------------------------------------------------------------------- */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 mb-4 text-2xl font-semibold tracking-tight md:text-[26px]">
      {children}
    </h2>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-[color:var(--color-muted)] px-1.5 py-0.5 font-mono text-[0.875em] text-[color:var(--color-foreground)]">
      {children}
    </code>
  );
}
