import { createFetchHandler, type WorkbenchOptions } from "@getworkbench/core";
import type { Queue } from "bullmq";
import type { IncomingHttpHeaders, IncomingMessage } from "node:http";

/**
 * Minimal Adonis HTTP context shape. Typed structurally so consumers on
 * AdonisJS 6 or 7 are not locked to a specific `@adonisjs/core` version in
 * our public types.
 */
interface AdonisHttpRequest {
  method(): string;
  headers(): IncomingHttpHeaders;
  completeUrl(includeQueryString?: boolean): string;
  /** Underlying Node `IncomingMessage`. */
  request: IncomingMessage;
}

interface AdonisHttpResponse {
  status(code: number): AdonisHttpResponse;
  header(key: string, value: string): AdonisHttpResponse;
  send(body: Buffer): void;
}

export interface AdonisHttpContext {
  request: AdonisHttpRequest;
  response: AdonisHttpResponse;
}

export type AdonisRouteHandler = (ctx: AdonisHttpContext) => Promise<void>;

/** Router surface used by {@link mountWorkbench}. */
export interface AdonisRouter {
  any(pattern: string, handler: AdonisRouteHandler): unknown;
}

/**
 * Mount the Workbench dashboard on an AdonisJS route.
 *
 * Returns a route handler you register with `router.any(...)`. Register it at
 * both the bare mount path and a wildcard so `/jobs`, `/jobs/`, and deep
 * client routes all resolve.
 *
 * `basePath` is required — Adonis preserves the full URL on each request, so
 * the adapter needs the mount prefix to strip before routing and to emit a
 * correct `<base href>` in the HTML shell.
 *
 * @example
 * ```ts
 * // start/routes.ts
 * import router from "@adonisjs/core/services/router";
 * import { Queue } from "bullmq";
 * import { mountWorkbench } from "@getworkbench/adonis";
 *
 * const emails = new Queue("emails", {
 *   connection: { url: process.env.REDIS_URL! },
 * });
 *
 * mountWorkbench(router, "/jobs", {
 *   queues: [emails],
 *   auth: {
 *     username: process.env.WORKBENCH_USER!,
 *     password: process.env.WORKBENCH_PASS!,
 *   },
 * });
 * ```
 */
export function workbench(
  options: WorkbenchOptions | Queue[],
): AdonisRouteHandler {
  const resolved = resolveOptions(options);
  if (!resolved.basePath) {
    throw new Error(
      '@getworkbench/adonis: `basePath` is required (e.g. `basePath: "/jobs"`).',
    );
  }

  const { fetch } = createFetchHandler(resolved);

  return async ({ request, response }) => {
    const url = request.completeUrl(true);
    const headers = new Headers();

    for (const [key, value] of Object.entries(request.headers())) {
      if (typeof value === "string") {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        for (const entry of value) headers.append(key, entry);
      }
    }

    const init: Record<string, unknown> = {
      method: request.method(),
      headers,
    };

    if (request.method() !== "GET" && request.method() !== "HEAD") {
      init.duplex = "half";
      init.body = request.request;
    }

    const webResponse = await fetch(new Request(url, init as RequestInit));

    response.status(webResponse.status);
    webResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "content-length") return;
      response.header(key, value);
    });

    response.send(Buffer.from(await webResponse.arrayBuffer()));
  };
}

/**
 * Register Workbench on an Adonis router at `mountPath` and `mountPath/*`.
 */
export function mountWorkbench(
  router: AdonisRouter,
  mountPath: string,
  options: WorkbenchOptions | Queue[],
): void {
  const basePath = normalizeMountPath(mountPath);
  const handler = workbench({
    ...(Array.isArray(options) ? { queues: options } : options),
    basePath,
  });

  router.any(basePath, handler);
  router.any(`${basePath}/*`, handler);
}

function resolveOptions(
  options: WorkbenchOptions | Queue[],
): WorkbenchOptions {
  return Array.isArray(options) ? { queues: options } : options;
}

function normalizeMountPath(value: string): string {
  const trimmed = value.endsWith("/") ? value.slice(0, -1) : value;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export type { WorkbenchOptions } from "@getworkbench/core";
