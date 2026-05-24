import { workbench } from "@getworkbench/express";
import { Queue, Worker } from "bullmq";
import express from "express";

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

const app = express();
app.get("/", (_req, res) =>
  res.type("text/plain").send("Try /jobs for the Workbench dashboard."),
);

app.use(
  "/jobs",
  workbench({
    queues,
    title: "Express · Workbench",
    auth,
  }),
);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Workbench example listening on http://localhost:${port}/jobs`);
  console.log(`Queues: ${QUEUE_NAMES.join(", ")}`);
});

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
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
