import { createFetchHandler, type WorkbenchOptions } from "@getworkbench/core";
import type { Queue } from "bullmq";

/**
 * Mount the Workbench dashboard on an Elysia app.
 *
 * Returns a web-standard fetch handler that Elysia's `.mount(path, handler)`
 * accepts directly — no plugin glue, no separate setup.
 *
 * Elysia's `.mount()` strips the mount prefix before passing the request,
 * so always pass `basePath` matching the mount path — that's what the
 * dashboard's HTML uses for its `<base href>` so assets resolve correctly.
 *
 * @example
 * ```ts
 * import { Elysia } from "elysia";
 * import { Queue } from "bullmq";
 * import { workbench } from "@getworkbench/elysia";
 *
 * const emailQueue = new Queue("email", {
 *   connection: { url: process.env.REDIS_URL! },
 * });
 *
 * new Elysia()
 *   .mount(
 *     "/jobs",
 *     workbench({
 *       queues: [emailQueue],
 *       basePath: "/jobs",
 *       auth: {
 *         username: process.env.WORKBENCH_USER!,
 *         password: process.env.WORKBENCH_PASS!,
 *       },
 *     }),
 *   )
 *   .listen(3000);
 * ```
 */
export function workbench(
  options: WorkbenchOptions | Queue[],
): (req: Request) => Promise<Response> {
  return createFetchHandler(options).fetch;
}

export type { WorkbenchOptions } from "@getworkbench/core";
