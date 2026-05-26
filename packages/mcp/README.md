<p align="center">
  <a href="https://getworkbench.dev">
    <img src="https://raw.githubusercontent.com/pontusab/workbench/main/hero.png" alt="Workbench — the missing dashboard for BullMQ" />
  </a>
</p>

# @getworkbench/mcp

> Model Context Protocol server for Workbench — let Cursor, Claude Desktop, Zed, Continue, or any other MCP-aware agent inspect, debug, and operate your BullMQ queues through your running Workbench dashboard.

The MCP server is a thin local proxy. It speaks **JSON-RPC over stdio** to your editor / agent, and **HTTP** to a running Workbench dashboard (desktop app, embedded mount, doesn't matter). The dashboard's existing auth and `readonly` flag are the source of truth — set them once, the MCP inherits the rules.

```
   Cursor / Claude Desktop ──┐
   Zed / Continue.dev ───────┼──▶ workbench-mcp (stdio) ──▶  https://your.workbench/jobs  ──▶  Redis / BullMQ
   any MCP client      ──────┘                                 (auth, readonly, etc.)
```

## Why?

Workbench gives developers a beautiful BullMQ dashboard. The MCP server gives **agents** the same surface. Same data, same operations, same permissions — but reachable from an AI editor's chat.

Real examples:

- *"Why is `email-send` backed up?"* — the agent calls `workbench_get_metrics`, sees p95 latency spiked at 14:02, calls `workbench_list_runs` with `status=failed` and `from=14:00`, finds the regression.
- *"Retry every failed `webhook-deliver` from the last hour."* — `workbench_list_runs` + `workbench_bulk_retry`.
- *"Run the nightly billing scheduler now so I can verify the fix."* — `workbench_list_schedulers` + `workbench_run_scheduler_now` (added in Workbench 0.5.0).

## Install

The MCP server runs straight from `npx` — no global install needed.

```sh
npx @getworkbench/mcp
```

To verify it starts, run it directly with the env vars set; it should print a `connected via stdio` line to stderr and then wait on stdin.

```sh
WORKBENCH_URL=http://localhost:3000/jobs \
WORKBENCH_USERNAME=admin \
WORKBENCH_PASSWORD=hunter2 \
npx @getworkbench/mcp
```

## Configure

Three env vars; one is required.

| Variable              | Required | Notes                                                                                       |
| --------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `WORKBENCH_URL`       | yes      | The same URL you'd open in a browser to see Workbench — e.g. `http://localhost:3000/jobs`.  |
| `WORKBENCH_USERNAME`  | no       | Basic auth username, if the dashboard was started with auth.                                |
| `WORKBENCH_PASSWORD`  | no       | Basic auth password.                                                                        |
| `WORKBENCH_TOKEN`     | no       | Bearer token. Takes precedence over Basic auth when set. Use behind a token-aware reverse proxy. |

If your dashboard mount is at the default `/jobs`, `WORKBENCH_URL=http://localhost:3000/jobs` is correct. The MCP appends `/api/...` for every request, so don't pass `/jobs/api` yourself.

`readonly` mode on the dashboard is preserved end-to-end: every write tool returns an actionable error if the dashboard refuses with `403`.

## Client setup

### Cursor

Add to `~/.cursor/mcp.json` (or your project's `.cursor/mcp.json`):

```json
{
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
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
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
}
```

### Zed

Add to `~/.config/zed/settings.json` under `"context_servers"`:

```json
{
  "context_servers": {
    "workbench": {
      "command": "npx",
      "args": ["-y", "@getworkbench/mcp"],
      "env": {
        "WORKBENCH_URL": "http://localhost:3000/jobs"
      }
    }
  }
}
```

### Continue.dev

Add to `~/.continue/config.json` under `"experimental.modelContextProtocolServers"`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "workbench",
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["-y", "@getworkbench/mcp"],
          "env": {
            "WORKBENCH_URL": "http://localhost:3000/jobs"
          }
        }
      }
    ]
  }
}
```

## Tools

18 tools, grouped by intent. Every read tool is annotated `readOnlyHint: true`; every write tool is annotated `destructiveHint: true` so the client can prompt before executing.

### Inspect

| Tool                          | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| `workbench_get_overview`      | Per-queue snapshot — names, paused state, count summary.      |
| `workbench_list_queues`       | Queues with full per-status counts.                           |
| `workbench_get_quick_counts`  | Lightweight counts, cheap for polling.                        |
| `workbench_get_metrics`       | Per-queue p50 / p95 latency + throughput.                     |
| `workbench_get_activity`      | 24h activity buckets (completed / failed per hour).           |
| `workbench_list_jobs`         | Jobs in a queue, status-filtered, paginated.                  |
| `workbench_list_runs`         | Cross-queue runs — text / status / time-range / tag filters.  |
| `workbench_get_job`           | Full payload + attempts + stacktrace for one job.             |
| `workbench_search_jobs`       | Free-text search across job ids, names, tag values.           |
| `workbench_list_schedulers`   | Repeatable + delayed schedulers.                              |
| `workbench_list_flows`        | Recent FlowProducer roots.                                    |
| `workbench_get_flow`          | Full DAG for a FlowProducer flow.                             |
| `workbench_list_tag_values`   | Distinct values for a configured tag field.                   |

### Operate

| Tool                            | Purpose                                                              |
| ------------------------------- | -------------------------------------------------------------------- |
| `workbench_retry_job`           | Retry a single failed job.                                           |
| `workbench_remove_job`          | Delete a job (any state).                                            |
| `workbench_promote_job`         | Force a delayed job to run now.                                      |
| `workbench_pause_queue`         | Pause a queue.                                                       |
| `workbench_resume_queue`        | Resume a paused queue.                                               |
| `workbench_run_scheduler_now`   | One-off trigger for a repeatable scheduler (no schedule disruption). |
| `workbench_enqueue_job`         | Add a new job to a queue.                                            |
| `workbench_clean_jobs`          | Bulk-remove completed or failed jobs.                                |
| `workbench_bulk_retry`          | Retry many failed jobs in one call.                                  |
| `workbench_bulk_delete`         | Delete many jobs in one call.                                        |

## Security notes

- **Run the dashboard with auth.** The MCP enforces nothing of its own — it just relays calls to the dashboard. If you expose the dashboard to anyone, set `username` / `password` (or token) and pass them to the MCP via env.
- **Run the dashboard with `readonly: true` for fully unsupervised agents.** Every write tool will return a clear error explaining the restriction.
- **The MCP runs locally as a subprocess of your editor.** It never opens a port; the dashboard URL is the only network endpoint involved.

## License

MIT — see [LICENSE](./LICENSE).
