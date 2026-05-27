import { Queue } from "bullmq";

export const QUEUE_NAMES = ["email", "image"] as const;

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };

export const queues = QUEUE_NAMES.map(
  (name) => new Queue(name, { connection }),
);
