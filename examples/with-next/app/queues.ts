import "server-only";

import { Queue } from "bullmq";

export const QUEUE_NAMES = ["email", "image"] as const;

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };

/**
 * Module-level BullMQ Queue instances. Reused across requests in the
 * Workbench route handler and exported for the worker process.
 */
export const queues = QUEUE_NAMES.map(
  (name) => new Queue(name, { connection }),
);
