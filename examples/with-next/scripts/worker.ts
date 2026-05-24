/**
 * Sibling worker process for the Next.js example.
 *
 * Next.js itself doesn't host long-running BullMQ workers, so we run them
 * in a separate Node process started in parallel by the `dev` script.
 */

import { Queue, Worker } from "bullmq";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };
const QUEUE_NAMES = ["email", "image"] as const;

const queues = QUEUE_NAMES.map((name) => new Queue(name, { connection }));

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const workers = queues.map(
  (queue) =>
    new Worker(
      queue.name,
      async () => {
        await sleep(200 + Math.random() * 800);
        if (Math.random() < 0.05) throw new Error("simulated failure");
        return { ok: true };
      },
      { connection, concurrency: 2 },
    ),
);

console.log(`Worker running against ${connection.url}`);
console.log(`Queues: ${QUEUE_NAMES.join(", ")}`);

setInterval(async () => {
  for (const queue of queues) {
    await queue.add(`${queue.name}.tick`, {
      at: new Date().toISOString(),
      id: Math.random().toString(36).slice(2, 10),
    });
  }
}, 1500);

const shutdown = async () => {
  console.log("Shutting down workers …");
  await Promise.all(workers.map((w) => w.close()));
  await Promise.all(queues.map((q) => q.close()));
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
