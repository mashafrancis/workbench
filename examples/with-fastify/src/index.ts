import { workbench } from "@getworkbench/fastify";
import { Queue, Worker } from "bullmq";
import Fastify from "fastify";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };
const QUEUE_NAMES = ["email", "image"] as const;

const queues = QUEUE_NAMES.map((name) => new Queue(name, { connection }));

const auth =
  process.env.WORKBENCH_USER && process.env.WORKBENCH_PASS
    ? {
        username: process.env.WORKBENCH_USER,
        password: process.env.WORKBENCH_PASS,
      }
    : undefined;

const app = Fastify();

app.get("/", async () => "Try /jobs for the Workbench dashboard.");

await app.register(
  workbench({
    queues,
    title: "Fastify · Workbench",
    auth,
  }),
  { prefix: "/jobs" },
);

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
console.log(`Workbench example listening on http://localhost:${port}/jobs`);
console.log(`Queues: ${QUEUE_NAMES.join(", ")}`);

/* ------------------------------------------------------------------ */
/* In-process worker + producer so the dashboard always has live data */
/* ------------------------------------------------------------------ */

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

setInterval(async () => {
  for (const queue of queues) {
    await queue.add(`${queue.name}.tick`, {
      at: new Date().toISOString(),
      id: Math.random().toString(36).slice(2, 10),
    });
  }
}, 1500);

const shutdown = async () => {
  await Promise.all(workers.map((w) => w.close()));
  await Promise.all(queues.map((q) => q.close()));
  await app.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
