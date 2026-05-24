/**
 * Optional: run BullMQ workers against every seeded queue so the dashboard
 * shows live "active" counts and a steady stream of completing/failing jobs.
 *
 * Run it in a second terminal alongside `bun run dev`:
 *   bun run workers
 *
 * The workers deliberately sleep and occasionally throw so that metrics keep
 * looking realistic while screenshots are being taken.
 */

import { Queue, Worker } from "bullmq";
import {
  ERRORS,
  JOB_NAMES,
  PAYLOAD,
  pick,
  QUEUE_NAMES,
  QUEUE_PROFILES,
  type QueueName,
  sampleDuration,
} from "./fixtures";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = { url: REDIS_URL };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Top up each queue with a trickle of new waiting jobs so the workers always
 * have something to chew on during a screenshot session.
 */
async function startTrickle(queue: Queue, queueName: QueueName): Promise<void> {
  const tick = async () => {
    try {
      const n = 1 + Math.floor(Math.random() * 3);
      const jobs = Array.from({ length: n }, () => {
        const name = pick(JOB_NAMES[queueName]);
        return {
          name,
          data: PAYLOAD[queueName](name),
          opts: {
            attempts: 3,
            backoff: { type: "exponential" as const, delay: 500 },
          },
        };
      });
      await queue.addBulk(jobs);
    } catch {
      // ignore — keep ticking
    }
  };
  setInterval(tick, 1500 + Math.random() * 2500);
}

function buildWorker(queueName: QueueName): Worker {
  const profile = QUEUE_PROFILES[queueName];
  return new Worker(
    queueName,
    async () => {
      const duration = sampleDuration(profile.medianMs, profile.tailMs);
      // Cap per-job sleep so workers don't hog the screenshot session.
      await sleep(Math.min(duration, 5000));
      if (Math.random() < profile.failRate) {
        const err = pick(ERRORS[queueName]);
        const e = new Error(err.message);
        e.stack = `${err.message}\n${err.stack.join("\n")}`;
        throw e;
      }
      return { ok: true, durationMs: duration };
    },
    { connection, concurrency: 3 },
  );
}

async function main(): Promise<void> {
  console.log(`→ Starting workers against ${REDIS_URL}`);
  const queues: Queue[] = [];
  const workers: Worker[] = [];
  for (const queueName of QUEUE_NAMES) {
    const queue = new Queue(queueName, { connection });
    queues.push(queue);
    workers.push(buildWorker(queueName));
    await startTrickle(queue, queueName);
    console.log(`  ${queueName}`);
  }

  const shutdown = async () => {
    console.log("\n→ Shutting down workers …");
    await Promise.all(workers.map((w) => w.close()));
    await Promise.all(queues.map((q) => q.close()));
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Worker runner failed:", err);
  process.exit(1);
});
