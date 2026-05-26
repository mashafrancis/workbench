/**
 * Tool registrations for the Workbench MCP server.
 *
 * Each tool maps to one or two endpoints on the dashboard's REST API
 * (see `packages/core/src/api/handlers.ts` for the server side). Inputs are
 * Zod-validated; outputs are passed through from the dashboard as-is and
 * surfaced both in `structuredContent` (machine-friendly) and a compact
 * pretty-printed `text` (human-friendly) — the LLM gets both for free and
 * picks what it needs.
 *
 * Annotations:
 *   - Every read tool sets `readOnlyHint: true` so an MCP client (Cursor's
 *     auto-approve, Claude Desktop's allow-list, etc.) can permit them
 *     without explicit confirmation.
 *   - Every write tool sets `destructiveHint: true` so the same clients
 *     prompt the user before the LLM calls them — these are the operations
 *     that modify production queues.
 *
 * `enqueueJob` is the one write that isn't *strictly* destructive (it
 * appends a new job rather than mutating an existing one) but we mark it
 * destructive anyway because "the LLM added a job to my production queue
 * without asking" is exactly the surprise we want to avoid by default.
 *
 * Job-status enum mirrors `JobStatus` in `@getworkbench/core`. Kept as a
 * local Zod enum (rather than importing the type) to keep this package
 * dependency-free of `@getworkbench/core`.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WorkbenchApiError, type WorkbenchClient } from "./client.js";

const JOB_STATUS = z.enum([
  "completed",
  "failed",
  "active",
  "waiting",
  "delayed",
  "paused",
  "prioritized",
  "waiting-children",
]);

const SORT_DIR = z.enum(["asc", "desc"]);

// 25 KB is the same ceiling the mcp-builder skill recommends — wide enough
// for /runs at limit=50 with rich tag payloads, tight enough that a tool
// call never blows out an agent's context window.
const CHARACTER_LIMIT = 25_000;

/**
 * Wrap a handler so any `WorkbenchApiError` (or other throw) is returned as
 * a `isError: true` tool response with the actionable message the client
 * baked into `explainStatus`. The MCP SDK already handles uncaught throws,
 * but they surface as protocol-level errors instead of in-result errors —
 * `isError: true` is what lets the LLM see the message and recover.
 */
function safeHandler<T>(fn: (input: T) => Promise<unknown>) {
  return async (input: T) => {
    try {
      const result = await fn(input);
      return toolResponse(result);
    } catch (err) {
      const message =
        err instanceof WorkbenchApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);
      return {
        isError: true,
        content: [{ type: "text" as const, text: `Error: ${message}` }],
      };
    }
  };
}

/**
 * Render a successful tool result. Truncates the text view when the
 * pretty-printed JSON would blow past `CHARACTER_LIMIT`, but always passes
 * the *full* result through `structuredContent` so clients that support it
 * (Claude Desktop, Cursor's newer tool runner) can reason over the whole
 * payload without re-fetching.
 */
function toolResponse(result: unknown) {
  let text = JSON.stringify(result, null, 2);
  let truncated = false;
  if (text.length > CHARACTER_LIMIT) {
    text =
      `${text.slice(0, CHARACTER_LIMIT)}\n... [truncated: response too large for inline text; ` +
      `the full payload is available in structuredContent. Re-call with a smaller ` +
      `limit / narrower filters for an inline view.]`;
    truncated = true;
  }
  return {
    content: [{ type: "text" as const, text }],
    structuredContent: {
      data: result,
      ...(truncated ? { truncated: true } : {}),
    },
  };
}

export function registerAllTools(
  server: McpServer,
  client: WorkbenchClient,
): void {
  /* ─────────────────────────── Read-only tools ─────────────────────────── */

  server.registerTool(
    "workbench_get_overview",
    {
      title: "Get dashboard overview",
      description:
        "Get a high-level snapshot of every queue Workbench knows about — names, paused state, and a summary of job counts per status. Use this first to discover available queues before drilling into a specific one. Read-only; safe to call frequently.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async () => client.get("/overview")),
  );

  server.registerTool(
    "workbench_list_queues",
    {
      title: "List queues with counts",
      description:
        "List every registered queue with its per-status job counts (completed, failed, active, waiting, delayed, paused, prioritized, waiting-children). Use this when the agent needs to choose a queue to inspect or to spot a queue that's accumulating failures or backlog.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async () => client.get("/queues")),
  );

  server.registerTool(
    "workbench_get_quick_counts",
    {
      title: "Get quick job counts",
      description:
        "Lightweight per-queue job counts only — no metadata, no per-status breakdown beyond the four primary states. Significantly cheaper than `workbench_list_queues`; prefer this for repeated polling / progress checks.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async () => client.get("/counts")),
  );

  server.registerTool(
    "workbench_get_metrics",
    {
      title: "Get queue latency + throughput metrics",
      description:
        "Per-queue p50 / p95 wait & process latency and throughput sparklines as computed by the dashboard. Useful for diagnosing 'why is my queue backing up' or comparing performance across deploys.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async () => client.get("/metrics")),
  );

  server.registerTool(
    "workbench_get_activity",
    {
      title: "Get activity stats (24h)",
      description:
        "Site-wide 24h activity buckets (completed / failed per hour) the dashboard uses to render its activity heatmap. Use to spot a regression that started at a specific hour.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async () => client.get("/activity")),
  );

  server.registerTool(
    "workbench_list_jobs",
    {
      title: "List jobs in a queue",
      description:
        "List jobs in a specific queue, optionally filtered by status. Cursor-paginated (use the `cursor` field from the previous response). Defaults to 50 jobs per page; max 200.",
      inputSchema: {
        queueName: z.string().min(1).describe("Queue name to list jobs from"),
        status: JOB_STATUS.optional().describe(
          "Filter by BullMQ status (omit for all)",
        ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .default(50)
          .describe("Max jobs to return (1-200, default 50)"),
        cursor: z
          .string()
          .optional()
          .describe("Pagination cursor from a previous response"),
        sortField: z
          .string()
          .optional()
          .describe(
            "Sort field (e.g. 'timestamp', 'processedOn', 'finishedOn')",
          ),
        sortDir: SORT_DIR.optional().describe("Sort direction (asc / desc)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) => {
      const sort =
        input.sortField && input.sortDir
          ? `${input.sortField}:${input.sortDir}`
          : undefined;
      return client.get(`/queues/${encodeURIComponent(input.queueName)}/jobs`, {
        status: input.status,
        limit: input.limit,
        cursor: input.cursor,
        sort,
      });
    }),
  );

  server.registerTool(
    "workbench_list_runs",
    {
      title: "List runs across queues",
      description:
        "Cross-queue 'recent runs' view, the same one the dashboard's main /runs page shows. Supports text search, status filter, time-range filter, and tag filter. Use this to answer 'show me failed jobs in the last hour across all queues'.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .default(50)
          .describe("Max runs to return (1-200, default 50)"),
        cursor: z.string().optional().describe("Pagination cursor"),
        status: JOB_STATUS.optional().describe("Filter by status"),
        q: z
          .string()
          .optional()
          .describe(
            "Free-text search (matches job id, name, and registered text fields)",
          ),
        from: z
          .number()
          .int()
          .optional()
          .describe("Start of time range (epoch ms)"),
        to: z
          .number()
          .int()
          .optional()
          .describe("End of time range (epoch ms)"),
        tags: z
          .record(z.string(), z.string())
          .optional()
          .describe(
            "Tag filter as a record of field → value (e.g. {tenantId: 'abc'})",
          ),
        sortField: z.string().optional().describe("Sort field"),
        sortDir: SORT_DIR.optional().describe("Sort direction"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) => {
      const sort =
        input.sortField && input.sortDir
          ? `${input.sortField}:${input.sortDir}`
          : undefined;
      return client.get("/runs", {
        limit: input.limit,
        cursor: input.cursor,
        status: input.status,
        q: input.q,
        from: input.from,
        to: input.to,
        tags: input.tags ? JSON.stringify(input.tags) : undefined,
        sort,
      });
    }),
  );

  server.registerTool(
    "workbench_get_job",
    {
      title: "Get a single job",
      description:
        "Full payload for one job — data, opts, attempts, processed/finished timestamps, stacktrace (for failed jobs), and progress. The primary tool for 'why did job X fail'.",
      inputSchema: {
        queueName: z.string().min(1).describe("Queue name"),
        jobId: z.string().min(1).describe("Job id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) =>
      client.get(
        `/jobs/${encodeURIComponent(input.queueName)}/${encodeURIComponent(input.jobId)}`,
      ),
    ),
  );

  server.registerTool(
    "workbench_search_jobs",
    {
      title: "Search jobs",
      description:
        "Free-text search across job ids, names, and any text fields the dashboard was configured to index. Returns the same shape as `workbench_list_runs` but matched against the search string.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("Search string (job id, name, or indexed field value)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe("Max matches to return (1-100, default 20)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) =>
      client.get("/search", { q: input.query, limit: input.limit }),
    ),
  );

  server.registerTool(
    "workbench_list_schedulers",
    {
      title: "List schedulers",
      description:
        "List every repeatable-job scheduler (cron / 'every N ms') and every ad-hoc delayed job. Each entry includes its key, name, pattern / interval, next run time, and timezone. The scheduler `key` is what `workbench_run_scheduler_now` takes.",
      inputSchema: {
        repeatableSortField: z.string().optional(),
        repeatableSortDir: SORT_DIR.optional(),
        delayedSortField: z.string().optional(),
        delayedSortDir: SORT_DIR.optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) => {
      const repeatableSort =
        input.repeatableSortField && input.repeatableSortDir
          ? `${input.repeatableSortField}:${input.repeatableSortDir}`
          : undefined;
      const delayedSort =
        input.delayedSortField && input.delayedSortDir
          ? `${input.delayedSortField}:${input.delayedSortDir}`
          : undefined;
      return client.get("/schedulers", { repeatableSort, delayedSort });
    }),
  );

  server.registerTool(
    "workbench_list_flows",
    {
      title: "List FlowProducer flows",
      description:
        "List recent BullMQ FlowProducer roots (parent / child job DAGs). Use to discover the root job id, then call `workbench_get_flow` for the full tree.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .default(50)
          .describe("Max flows to return (1-200, default 50)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) => client.get("/flows", { limit: input.limit })),
  );

  server.registerTool(
    "workbench_get_flow",
    {
      title: "Get a FlowProducer DAG",
      description:
        "Get the full parent / child DAG for a FlowProducer flow, with per-node status and duration. Use after `workbench_list_flows` to inspect a specific flow root.",
      inputSchema: {
        queueName: z
          .string()
          .min(1)
          .describe("Queue name the flow root lives on"),
        jobId: z.string().min(1).describe("Flow root job id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) =>
      client.get(
        `/flows/${encodeURIComponent(input.queueName)}/${encodeURIComponent(input.jobId)}`,
      ),
    ),
  );

  server.registerTool(
    "workbench_list_tag_values",
    {
      title: "List values for a tag field",
      description:
        "List the distinct values currently indexed for a configured tag field (e.g. 'tenantId', 'userId', 'jobType'). Useful for building a tag filter for `workbench_list_runs` without having to scan jobs first. Returns an error if `field` isn't a configured tag field.",
      inputSchema: {
        field: z.string().min(1).describe("Tag field name"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .default(50)
          .describe("Max values to return (1-200, default 50)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) =>
      client.get(`/tags/${encodeURIComponent(input.field)}/values`, {
        limit: input.limit,
      }),
    ),
  );

  /* ────────────────────────── Destructive tools ────────────────────────── */

  server.registerTool(
    "workbench_retry_job",
    {
      title: "Retry a failed job",
      description:
        "Re-enqueue a single failed job. The job id is unchanged; this is the same action as the 'Retry' button in the dashboard's run detail. Blocked when the dashboard is running in readonly mode.",
      inputSchema: {
        queueName: z.string().min(1).describe("Queue name"),
        jobId: z.string().min(1).describe("Job id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) =>
      client.post(
        `/jobs/${encodeURIComponent(input.queueName)}/${encodeURIComponent(input.jobId)}/retry`,
      ),
    ),
  );

  server.registerTool(
    "workbench_remove_job",
    {
      title: "Remove a job",
      description:
        "Permanently delete a job from its queue (any state — completed, failed, delayed, waiting). Irreversible. Blocked when the dashboard is running in readonly mode.",
      inputSchema: {
        queueName: z.string().min(1).describe("Queue name"),
        jobId: z.string().min(1).describe("Job id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) =>
      client.post(
        `/jobs/${encodeURIComponent(input.queueName)}/${encodeURIComponent(input.jobId)}/remove`,
      ),
    ),
  );

  server.registerTool(
    "workbench_promote_job",
    {
      title: "Promote a delayed job",
      description:
        "Move a delayed job to the 'waiting' state so workers pick it up immediately, regardless of its original delay. Blocked when the dashboard is running in readonly mode.",
      inputSchema: {
        queueName: z.string().min(1).describe("Queue name"),
        jobId: z.string().min(1).describe("Job id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) =>
      client.post(
        `/jobs/${encodeURIComponent(input.queueName)}/${encodeURIComponent(input.jobId)}/promote`,
      ),
    ),
  );

  server.registerTool(
    "workbench_pause_queue",
    {
      title: "Pause a queue",
      description:
        "Pause a queue so workers stop pulling new jobs. In-flight jobs continue; new ones queue up. Blocked when the dashboard is running in readonly mode.",
      inputSchema: {
        queueName: z.string().min(1).describe("Queue name"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) =>
      client.post(`/queues/${encodeURIComponent(input.queueName)}/pause`),
    ),
  );

  server.registerTool(
    "workbench_resume_queue",
    {
      title: "Resume a paused queue",
      description:
        "Resume a previously paused queue. Workers immediately start pulling jobs again. Blocked when the dashboard is running in readonly mode.",
      inputSchema: {
        queueName: z.string().min(1).describe("Queue name"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) =>
      client.post(`/queues/${encodeURIComponent(input.queueName)}/resume`),
    ),
  );

  server.registerTool(
    "workbench_run_scheduler_now",
    {
      title: "Run a scheduler immediately (one-off)",
      description:
        "Trigger a one-off run of a repeatable-job scheduler — equivalent to the Schedulers page 'Run now' button (added in Workbench 0.5.0). Enqueues a clone of the scheduler's job (same name + data + opts) so it executes immediately, without touching the cron / `every` schedule. Use the `key` from `workbench_list_schedulers`. Blocked when the dashboard is running in readonly mode.",
      inputSchema: {
        queueName: z.string().min(1).describe("Queue name"),
        schedulerKey: z
          .string()
          .min(1)
          .describe("Scheduler `key` as returned by workbench_list_schedulers"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) =>
      client.post(
        `/schedulers/${encodeURIComponent(input.queueName)}/${encodeURIComponent(input.schedulerKey)}/run`,
      ),
    ),
  );

  server.registerTool(
    "workbench_enqueue_job",
    {
      title: "Enqueue a job",
      description:
        "Add a new job to a queue — equivalent to the dashboard's 'Test job' form. Useful for kicking off a one-off run with a specific payload, or smoke-testing a worker after a deploy. Marked destructive because it produces real side-effects in your queue worker. Blocked when the dashboard is running in readonly mode.",
      inputSchema: {
        queueName: z.string().min(1).describe("Queue name"),
        jobName: z.string().min(1).describe("Job name (BullMQ job type)"),
        data: z
          .unknown()
          .optional()
          .describe("Job data (any JSON-serialisable value)"),
        delay: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Optional delay in ms before the job is processed"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) =>
      client.post("/test", {
        queueName: input.queueName,
        jobName: input.jobName,
        data: input.data ?? {},
        opts: input.delay !== undefined ? { delay: input.delay } : undefined,
      }),
    ),
  );

  server.registerTool(
    "workbench_clean_jobs",
    {
      title: "Clean completed or failed jobs",
      description:
        "Bulk-remove completed or failed jobs older than `grace` milliseconds. Returns the number of jobs removed. Use to shrink a Redis instance whose `removeOnComplete` / `removeOnFail` settings are too lax. Irreversible. Blocked when the dashboard is running in readonly mode.",
      inputSchema: {
        queueName: z.string().min(1).describe("Queue name"),
        status: z
          .enum(["completed", "failed"])
          .describe("Which job state to clean"),
        graceMs: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe(
            "Only remove jobs older than this many ms (0 = remove all matching jobs)",
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) =>
      client.post(`/queues/${encodeURIComponent(input.queueName)}/clean`, {
        status: input.status,
        grace: input.graceMs,
      }),
    ),
  );

  server.registerTool(
    "workbench_bulk_retry",
    {
      title: "Retry many failed jobs",
      description:
        "Bulk-retry a list of `{queueName, jobId}` pairs. Returns a per-job success / failure map. Cheaper than calling `workbench_retry_job` in a loop. Blocked when the dashboard is running in readonly mode.",
      inputSchema: {
        jobs: z
          .array(
            z.object({
              queueName: z.string().min(1),
              jobId: z.string().min(1),
            }),
          )
          .min(1)
          .max(500)
          .describe("Jobs to retry (1-500 per call)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) => client.post("/bulk/retry", input)),
  );

  server.registerTool(
    "workbench_bulk_delete",
    {
      title: "Delete many jobs",
      description:
        "Bulk-delete a list of `{queueName, jobId}` pairs. Returns a per-job success / failure map. Irreversible. Blocked when the dashboard is running in readonly mode.",
      inputSchema: {
        jobs: z
          .array(
            z.object({
              queueName: z.string().min(1),
              jobId: z.string().min(1),
            }),
          )
          .min(1)
          .max(500)
          .describe("Jobs to delete (1-500 per call)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    safeHandler(async (input) => client.post("/bulk/delete", input)),
  );
}
