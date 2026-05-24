/**
 * Seeds the Redis instance with realistic BullMQ data so every page of the
 * Workbench dashboard has something to show.
 *
 * What gets seeded:
 *  - 24h of completed + failed jobs per queue (via direct Redis writes with
 *    backdated timestamps so the metrics chart is fully populated)
 *  - Live waiting + delayed jobs per queue (via BullMQ's normal API)
 *  - A few BullMQ flows (parent + children across queues)
 *  - Repeatable job definitions (cron + interval) for the Schedulers page
 *
 * Usage:
 *   bun run seed           # add seed data on top of whatever is already there
 *   bun run seed --clean   # wipe existing bull:* keys first, then seed
 */

import { FlowProducer, Queue } from "bullmq";
import IORedis from "ioredis";
import {
  ERRORS,
  hourWeight,
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

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Per-queue target volume over the last 24h (completed jobs).
const COMPLETED_PER_QUEUE: Record<QueueName, number> = {
  email: 1400,
  invoice: 320,
  webhooks: 2600,
  reports: 90,
  "image-processing": 780,
  notifications: 3200,
};

async function maybeClean(redis: IORedis): Promise<void> {
  if (!process.argv.includes("--clean")) return;
  console.log("› Wiping existing bull:* keys …");
  let cursor = "0";
  do {
    const [next, keys] = await redis.scan(
      cursor,
      "MATCH",
      "bull:*",
      "COUNT",
      500,
    );
    cursor = next;
    if (keys.length > 0) await redis.del(...keys);
  } while (cursor !== "0");
}

function nextJobId(redis: IORedis, queueName: string): Promise<number> {
  return redis.incr(`bull:${queueName}:id`);
}

/** Pick a random timestamp in the last 24h, weighted by hour-of-day activity. */
function sampleFinishedOn(now: number): number {
  // Rejection sampling: draw uniform in [now-24h, now], accept with weight.
  for (let i = 0; i < 20; i++) {
    const t = now - Math.random() * DAY_MS;
    const hour = new Date(t).getHours();
    const w = hourWeight(hour);
    if (Math.random() < w / 2.2) return t;
  }
  return now - Math.random() * DAY_MS;
}

async function backfillHistory(redis: IORedis): Promise<void> {
  const now = Date.now();
  for (const queueName of QUEUE_NAMES) {
    const profile = QUEUE_PROFILES[queueName];
    const total = COMPLETED_PER_QUEUE[queueName];
    const failed = Math.round(total * profile.failRate);
    const completed = total - failed;

    const pipeline = redis.pipeline();

    // Completed jobs.
    for (let i = 0; i < completed; i++) {
      const id = await nextJobId(redis, queueName);
      const finishedOn = Math.floor(sampleFinishedOn(now));
      const duration = sampleDuration(profile.medianMs, profile.tailMs);
      const waitTime = sampleDuration(
        profile.medianWaitMs,
        profile.medianWaitMs * 8,
      );
      const processedOn = finishedOn - duration;
      const timestamp = processedOn - waitTime;
      const jobName = pick(JOB_NAMES[queueName]);
      const data = PAYLOAD[queueName](jobName);

      pipeline.hset(`bull:${queueName}:${id}`, {
        name: jobName,
        data: JSON.stringify(data),
        opts: JSON.stringify({
          attempts: 3,
          backoff: { type: "exponential", delay: 500 },
        }),
        timestamp: String(timestamp),
        delay: "0",
        priority: "0",
        processedOn: String(processedOn),
        finishedOn: String(finishedOn),
        attemptsMade: "1",
        returnvalue: JSON.stringify({ ok: true, durationMs: duration }),
      });
      pipeline.zadd(`bull:${queueName}:completed`, finishedOn, String(id));
    }

    // Failed jobs.
    for (let i = 0; i < failed; i++) {
      const id = await nextJobId(redis, queueName);
      const finishedOn = Math.floor(sampleFinishedOn(now));
      // Failures tend to be slightly slower on average (retries / timeouts).
      const duration = sampleDuration(profile.medianMs * 1.4, profile.tailMs);
      const waitTime = sampleDuration(
        profile.medianWaitMs,
        profile.medianWaitMs * 8,
      );
      const processedOn = finishedOn - duration;
      const timestamp = processedOn - waitTime;
      const jobName = pick(JOB_NAMES[queueName]);
      const data = PAYLOAD[queueName](jobName);
      const attemptsMade = 1 + Math.floor(Math.random() * 3);
      const err = pick(ERRORS[queueName]);

      pipeline.hset(`bull:${queueName}:${id}`, {
        name: jobName,
        data: JSON.stringify(data),
        opts: JSON.stringify({
          attempts: 3,
          backoff: { type: "exponential", delay: 500 },
        }),
        timestamp: String(timestamp),
        delay: "0",
        priority: "0",
        processedOn: String(processedOn),
        finishedOn: String(finishedOn),
        attemptsMade: String(attemptsMade),
        failedReason: err.message,
        stacktrace: JSON.stringify(err.stack),
      });
      pipeline.zadd(`bull:${queueName}:failed`, finishedOn, String(id));
    }

    await pipeline.exec();
    console.log(
      `  ${queueName.padEnd(18)} completed=${completed}  failed=${failed}`,
    );
  }
}

async function seedLiveState(): Promise<void> {
  const queues = new Map<QueueName, Queue>();
  for (const name of QUEUE_NAMES) {
    queues.set(name, new Queue(name, { connection }));
  }

  for (const queueName of QUEUE_NAMES) {
    const queue = queues.get(queueName)!;
    const waitingCount = 20 + Math.floor(Math.random() * 80);
    const delayedCount = 4 + Math.floor(Math.random() * 18);

    // Waiting.
    const waiting = Array.from({ length: waitingCount }, () => {
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
    await queue.addBulk(waiting);

    // Delayed (future work).
    const delayed = Array.from({ length: delayedCount }, () => {
      const name = pick(JOB_NAMES[queueName]);
      return {
        name,
        data: PAYLOAD[queueName](name),
        opts: {
          delay: Math.floor(30 * 1000 + Math.random() * 6 * HOUR_MS),
          attempts: 3,
        },
      };
    });
    await queue.addBulk(delayed);

    console.log(
      `  ${queueName.padEnd(18)} waiting=${waitingCount}  delayed=${delayedCount}`,
    );
  }

  await Promise.all(Array.from(queues.values()).map((q) => q.close()));
}

async function seedSchedulers(): Promise<void> {
  const defs: Array<{
    queue: QueueName;
    name: string;
    repeat: { pattern?: string; every?: number };
    data: Record<string, unknown>;
  }> = [
    {
      queue: "email",
      name: "send-digest",
      repeat: { pattern: "0 * * * *" }, // Hourly digest
      data: { kind: "digest", segment: "active-users" },
    },
    {
      queue: "reports",
      name: "daily-revenue",
      repeat: { pattern: "0 9 * * *" }, // 9am daily
      data: { range: "yesterday", format: "pdf" },
    },
    {
      queue: "webhooks",
      name: "stripe.subscription.updated",
      repeat: { every: 5 * 60 * 1000 }, // every 5 min retry sweep
      data: { sweep: true },
    },
    {
      queue: "image-processing",
      name: "compress-upload",
      repeat: { every: 15 * 60 * 1000 }, // every 15 min
      data: { batch: true },
    },
    {
      queue: "notifications",
      name: "digest-summary",
      repeat: { pattern: "*/30 * * * *" }, // every 30 min
      data: { scope: "team" },
    },
  ];

  for (const def of defs) {
    const queue = new Queue(def.queue, { connection });
    await queue.add(def.name, def.data, { repeat: def.repeat });
    await queue.close();
    console.log(
      `  ${def.queue.padEnd(18)} repeat "${def.name}"  ${
        def.repeat.pattern ?? `every ${def.repeat.every}ms`
      }`,
    );
  }
}

async function seedFlows(): Promise<void> {
  const flow = new FlowProducer({ connection });

  const flows = [
    {
      label: "order-fulfillment",
      tree: {
        name: "fulfill-order",
        queueName: "notifications" as QueueName,
        data: { orderId: `ord_${Math.random().toString(36).slice(2, 10)}` },
        children: [
          {
            name: "generate-pdf",
            queueName: "invoice" as QueueName,
            data: PAYLOAD.invoice("generate-pdf"),
          },
          {
            name: "send-receipt",
            queueName: "email" as QueueName,
            data: PAYLOAD.email("send-receipt"),
          },
          {
            name: "stripe.charge.succeeded",
            queueName: "webhooks" as QueueName,
            data: PAYLOAD.webhooks("stripe.charge.succeeded"),
          },
        ],
      },
    },
    {
      label: "nightly-report",
      tree: {
        name: "compile-report",
        queueName: "reports" as QueueName,
        data: { report: "daily-revenue" },
        children: [
          {
            name: "export-customers",
            queueName: "reports" as QueueName,
            data: PAYLOAD.reports("export-customers"),
          },
          {
            name: "export-transactions",
            queueName: "reports" as QueueName,
            data: PAYLOAD.reports("export-transactions"),
          },
          {
            name: "send-digest",
            queueName: "email" as QueueName,
            data: PAYLOAD.email("send-digest"),
            children: [
              {
                name: "generate-og-image",
                queueName: "image-processing" as QueueName,
                data: PAYLOAD["image-processing"]("generate-og-image"),
              },
            ],
          },
        ],
      },
    },
    {
      label: "user-onboarding",
      tree: {
        name: "welcome-user",
        queueName: "email" as QueueName,
        data: PAYLOAD.email("send-welcome"),
        children: [
          {
            name: "push-mobile",
            queueName: "notifications" as QueueName,
            data: PAYLOAD.notifications("push-mobile"),
          },
          {
            name: "send-invite",
            queueName: "email" as QueueName,
            data: PAYLOAD.email("send-invite"),
          },
        ],
      },
    },
  ];

  for (const f of flows) {
    await flow.add(f.tree);
    console.log(`  flow "${f.label}"`);
  }

  await flow.close();
}

async function main(): Promise<void> {
  console.log(`→ Seeding Workbench example data to ${REDIS_URL}`);
  const redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  await redis.ping();

  await maybeClean(redis);

  console.log("\n→ Backfilling 24h of completed + failed jobs");
  await backfillHistory(redis);

  console.log("\n→ Creating live waiting + delayed jobs");
  await seedLiveState();

  console.log("\n→ Creating scheduler definitions");
  await seedSchedulers();

  console.log("\n→ Creating BullMQ flows");
  await seedFlows();

  await redis.quit();
  console.log("\n✓ Done. Start the server with `bun run dev` and open /jobs.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
