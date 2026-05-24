import type { WorkbenchOptions } from "@getworkbench/core";
import { workbench as expressWorkbench } from "@getworkbench/express";
import { workbench as fastifyWorkbench } from "@getworkbench/fastify";
import type { INestApplication } from "@nestjs/common";
import type { Queue } from "bullmq";

/**
 * Mount the Workbench dashboard on a NestJS app.
 *
 * Works with both the Express (default) and Fastify NestJS platforms.
 * Detects the underlying HTTP adapter and wires the right adapter for you.
 *
 * @example
 * ```ts
 * import { NestFactory } from "@nestjs/core";
 * import { Queue } from "bullmq";
 * import { workbench } from "@getworkbench/nestjs";
 * import { AppModule } from "./app.module";
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *
 *   const emailQueue = new Queue("email", {
 *     connection: { url: process.env.REDIS_URL! },
 *   });
 *
 *   await workbench(app, "/jobs", {
 *     queues: [emailQueue],
 *     auth: {
 *       username: process.env.WORKBENCH_USER!,
 *       password: process.env.WORKBENCH_PASS!,
 *     },
 *   });
 *
 *   await app.listen(3000);
 * }
 * bootstrap();
 * ```
 *
 * Mount the call **before** `app.listen(...)`.
 */
export async function workbench(
  app: INestApplication,
  path: string,
  options: WorkbenchOptions | Queue[],
): Promise<void> {
  const httpAdapter = app.getHttpAdapter() as {
    getType?: () => string;
    getInstance: <T = unknown>() => T;
  };

  const platform =
    typeof httpAdapter.getType === "function"
      ? httpAdapter.getType()
      : "express";

  if (platform === "fastify") {
    const instance = httpAdapter.getInstance<{
      register: (plugin: unknown, opts: { prefix: string }) => Promise<unknown>;
    }>();
    await instance.register(fastifyWorkbench(options), { prefix: path });
    return;
  }

  app.use(path, expressWorkbench(options));
}

export type { WorkbenchOptions } from "@getworkbench/core";
