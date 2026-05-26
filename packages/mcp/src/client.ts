/**
 * Thin HTTP client over a running Workbench dashboard's REST API.
 *
 * The MCP server speaks to *the dashboard*, not directly to Redis. That's the
 * whole point of this package — it reuses the same auth, the same readonly
 * flag, the same business logic (`@getworkbench/core`'s `QueueManager`) that
 * the dashboard already enforces, so an LLM agent gets identical semantics to
 * a human clicking around the UI. No second source of truth for permissions,
 * no separate Redis connection to keep in sync, no duplicated cleanup logic.
 *
 * Auth model: the dashboard's CLI scaffolder offers HTTP Basic Auth when
 * mounting Workbench into a Node app. We default to Basic Auth for that
 * reason — same `WORKBENCH_USERNAME` / `WORKBENCH_PASSWORD` pair the
 * dashboard is configured with. A `WORKBENCH_TOKEN` env var is also
 * supported and overrides Basic Auth when set, so existing reverse-proxy
 * setups with bearer tokens can drop the MCP in without re-configuring auth.
 */

const DEFAULT_TIMEOUT_MS = 15_000;

export interface WorkbenchClientOptions {
  /**
   * Dashboard base URL — the same URL you'd open in a browser to see
   * Workbench. e.g. `http://localhost:3000/jobs`. The client appends
   * `/api/...` for every request; passing the API base directly also
   * works (the trailing `/api` is normalised).
   */
  baseUrl: string;
  /** Optional Basic Auth username (paired with `password`). */
  username?: string;
  /** Optional Basic Auth password. */
  password?: string;
  /** Optional bearer token; takes precedence over Basic Auth when set. */
  token?: string;
  /** Per-request timeout. Defaults to 15s — long enough for `/runs` with
   *  large filters on a busy queue, short enough that an LLM agent doesn't
   *  freeze when the dashboard is down. */
  timeoutMs?: number;
}

/**
 * Error thrown by the HTTP client when the dashboard returns a non-2xx, the
 * request times out, or the network call fails outright. Carries the HTTP
 * status (or `0` for network errors) so tool handlers can map it to an
 * actionable hint for the agent ("the dashboard says you don't have
 * permission — set WORKBENCH_USERNAME / WORKBENCH_PASSWORD").
 */
export class WorkbenchApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "WorkbenchApiError";
    this.status = status;
    this.body = body;
  }
}

export class WorkbenchClient {
  readonly apiBase: string;
  private readonly authHeader: string | undefined;
  private readonly timeoutMs: number;

  constructor(options: WorkbenchClientOptions) {
    if (!options.baseUrl) {
      throw new Error(
        "WORKBENCH_URL is required (e.g. http://localhost:3000/jobs)",
      );
    }

    // Strip trailing slashes once so we can safely template `${apiBase}${path}`.
    // If the user already pointed us at the API base (`.../jobs/api`), don't
    // double it — common mistake otherwise.
    const trimmed = options.baseUrl.replace(/\/+$/, "");
    this.apiBase = trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    if (options.token) {
      this.authHeader = `Bearer ${options.token}`;
    } else if (options.username && options.password) {
      const encoded = Buffer.from(
        `${options.username}:${options.password}`,
      ).toString("base64");
      this.authHeader = `Basic ${encoded}`;
    }
  }

  /** GET an API endpoint with optional query parameters. */
  async get<T = unknown>(
    path: string,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    return this.request<T>("GET", path, undefined, query);
  }

  /** POST an API endpoint with an optional JSON body. */
  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.apiBase}${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.authHeader) headers.Authorization = this.authHeader;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        throw new WorkbenchApiError(
          `Request to ${path} timed out after ${this.timeoutMs}ms`,
          0,
        );
      }
      const msg = err instanceof Error ? err.message : String(err);
      throw new WorkbenchApiError(
        `Network error contacting Workbench at ${url.origin}: ${msg}. ` +
          `Check WORKBENCH_URL and that the dashboard is running.`,
        0,
      );
    }
    clearTimeout(timer);

    // 204 No Content: treat as empty success.
    if (res.status === 204) return undefined as T;

    let parsed: unknown;
    const text = await res.text();
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      throw new WorkbenchApiError(
        this.explainStatus(res.status, parsed),
        res.status,
        parsed,
      );
    }

    return parsed as T;
  }

  /**
   * Turn a non-2xx into an actionable error message for the LLM agent.
   *
   * The body shape varies by handler, but every Workbench handler returns
   * `{ error: string }` on failure — we surface that string verbatim and
   * append a status-specific hint.
   */
  private explainStatus(status: number, body: unknown): string {
    const apiMessage =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : undefined;

    switch (status) {
      case 401:
        return (
          (apiMessage ?? "Unauthorized") +
          ". Set WORKBENCH_USERNAME and WORKBENCH_PASSWORD (or WORKBENCH_TOKEN) " +
          "to the same credentials the dashboard was started with."
        );
      case 403:
        return (
          (apiMessage ?? "Forbidden") +
          ". The dashboard is likely running with `readonly: true` — that " +
          "blocks every write operation (retry, remove, pause, enqueue, " +
          "scheduler-run-now). Restart Workbench without readonly mode to " +
          "perform write actions."
        );
      case 404:
        return apiMessage ?? "Not found — check the queue name and job id.";
      case 400:
        return apiMessage ?? "Bad request — check the input parameters.";
      case 429:
        return (
          (apiMessage ?? "Rate limited by Workbench") +
          ". Slow down concurrent calls or shrink result sizes."
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return (
          (apiMessage ?? `Dashboard returned ${status}`) +
          ". The dashboard may be overloaded, Redis may be unreachable, or " +
          "the queue you targeted may not be registered with Workbench."
        );
      default:
        return apiMessage ?? `Workbench API responded with status ${status}`;
    }
  }
}

/**
 * Build a client from the standard env-var contract. Throws with a clear
 * message if `WORKBENCH_URL` is missing — the MCP entry point catches that
 * and prints to stderr (stdio MCPs must keep stdout clean for the protocol).
 */
export function clientFromEnv(): WorkbenchClient {
  const baseUrl = process.env.WORKBENCH_URL;
  if (!baseUrl) {
    throw new Error(
      "WORKBENCH_URL is required (e.g. http://localhost:3000/jobs). " +
        "Set it to the base URL of your running Workbench dashboard.",
    );
  }
  return new WorkbenchClient({
    baseUrl,
    username: process.env.WORKBENCH_USERNAME,
    password: process.env.WORKBENCH_PASSWORD,
    token: process.env.WORKBENCH_TOKEN,
  });
}
