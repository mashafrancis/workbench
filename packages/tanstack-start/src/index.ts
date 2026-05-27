import { createFetchHandler, type WorkbenchOptions } from "@getworkbench/core";
import type { Queue } from "bullmq";

type TanStackServerHandler = (ctx: {
  request: Request;
}) => Response | Promise<Response>;

export interface WorkbenchServerHandlers {
  GET: TanStackServerHandler;
  POST: TanStackServerHandler;
  PUT: TanStackServerHandler;
  PATCH: TanStackServerHandler;
  DELETE: TanStackServerHandler;
}

/**
 * Mount the Workbench dashboard on TanStack Start server routes.
 *
 * Place the returned handlers on a catch-all server route and re-export them
 * through `createFileRoute(...)({ server: { handlers: workbench(...) } })`.
 * Register both the bare mount (`src/routes/jobs.ts`) and the splat
 * (`src/routes/jobs/$.ts`) so `/jobs`, `/jobs/`, and deep client routes all
 * resolve.
 *
 * `basePath` must match the route directory so the dashboard's `<base href>`
 * and internal routing line up with TanStack Start's URL.
 *
 * @example
 * ```ts
 * // src/routes/jobs/$.ts
 * import { createFileRoute } from "@tanstack/react-router";
 * import { Queue } from "bullmq";
 * import { workbench } from "@getworkbench/tanstack-start";
 *
 * const emails = new Queue("emails", {
 *   connection: { url: process.env.REDIS_URL! },
 * });
 *
 * export const Route = createFileRoute("/jobs/$")({
 *   server: {
 *     handlers: workbench({
 *       queues: [emails],
 *       basePath: "/jobs",
 *       auth: {
 *         username: process.env.WORKBENCH_USER!,
 *         password: process.env.WORKBENCH_PASS!,
 *       },
 *     }),
 *   },
 * });
 * ```
 */
export function workbench(
  options: WorkbenchOptions | Queue[],
): WorkbenchServerHandlers {
  const { fetch } = createFetchHandler(options);
  const handler: TanStackServerHandler = ({ request }) => fetch(request);

  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    PATCH: handler,
    DELETE: handler,
  };
}

export type { WorkbenchOptions } from "@getworkbench/core";
