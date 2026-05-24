import { createFetchHandler, type WorkbenchOptions } from "@getworkbench/core";
import type { Queue } from "bullmq";

type NextRouteHandler = (req: Request) => Promise<Response>;

export interface WorkbenchHandlers {
  GET: NextRouteHandler;
  POST: NextRouteHandler;
  PUT: NextRouteHandler;
  PATCH: NextRouteHandler;
  DELETE: NextRouteHandler;
}

/**
 * Mount the Workbench dashboard on a Next.js App Router catch-all route.
 *
 * Place this in `app/<mount>/[[...workbench]]/route.ts` and re-export the
 * HTTP methods. The dashboard becomes available at `/<mount>`.
 *
 * `basePath` must match the route file's directory so the dashboard's
 * `<base href>` and internal routing line up with Next.js's URL.
 *
 * @example
 * ```ts
 * // app/admin/jobs/[[...workbench]]/route.ts
 * import { Queue } from "bullmq";
 * import { workbench } from "@getworkbench/next";
 *
 * const emailQueue = new Queue("email", {
 *   connection: { url: process.env.REDIS_URL! },
 * });
 *
 * export const { GET, POST, PUT, PATCH, DELETE } = workbench({
 *   queues: [emailQueue],
 *   basePath: "/admin/jobs",
 *   auth: {
 *     username: process.env.WORKBENCH_USER!,
 *     password: process.env.WORKBENCH_PASS!,
 *   },
 * });
 * ```
 */
export function workbench(
  options: WorkbenchOptions | Queue[],
): WorkbenchHandlers {
  const { fetch } = createFetchHandler(options);
  return {
    GET: fetch,
    POST: fetch,
    PUT: fetch,
    PATCH: fetch,
    DELETE: fetch,
  };
}

export type { WorkbenchOptions } from "@getworkbench/core";
