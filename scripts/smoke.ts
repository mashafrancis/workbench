/**
 * Smoke test for every example app.
 *
 * Boots each `examples/with-<fw>` package as a subprocess, polls for the
 * dashboard to come up, asserts that the API endpoints return the expected
 * JSON shape, and that the catch-all serves an `<base href>` matching the
 * mount path. Bails on the first failure.
 *
 * Usage:
 *
 *   bun run smoke              # all examples
 *   bun run smoke elysia next  # subset
 *
 * Requires Redis on REDIS_URL (default redis://localhost:6379) — start it
 * with `docker compose up -d redis` from the repo root.
 */

import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

interface ExampleSpec {
  name: string;
  pkg: string;
  port: number;
  mount: string;
  /**
   * For Next.js we must build first because `next dev` is too slow to be a
   * reliable smoke target and prints a lot of unrelated noise. For everyone
   * else `bun run start` is enough.
   */
  setup?: string[];
  command: string[];
  /** A line we expect to see on stdout before we start probing. */
  readyMatch: RegExp;
}

const EXAMPLES: ExampleSpec[] = [
  {
    name: "hono",
    pkg: "example-with-hono",
    port: 3110,
    mount: "/jobs",
    command: ["bun", "run", "--filter", "example-with-hono", "start"],
    readyMatch: /listening on/i,
  },
  {
    name: "elysia",
    pkg: "example-with-elysia",
    port: 3111,
    mount: "/jobs",
    command: ["bun", "run", "--filter", "example-with-elysia", "start"],
    readyMatch: /listening on/i,
  },
  {
    name: "express",
    pkg: "example-with-express",
    port: 3112,
    mount: "/jobs",
    command: ["bun", "run", "--filter", "example-with-express", "start"],
    readyMatch: /listening on/i,
  },
  {
    name: "fastify",
    pkg: "example-with-fastify",
    port: 3113,
    mount: "/jobs",
    command: ["bun", "run", "--filter", "example-with-fastify", "start"],
    readyMatch: /listening on/i,
  },
  {
    name: "next",
    pkg: "example-with-next",
    port: 3114,
    mount: "/jobs",
    setup: ["bun", "run", "--filter", "example-with-next", "build"],
    command: ["bun", "run", "--filter", "example-with-next", "start"],
    readyMatch: /Ready|started server|local:.*3114/i,
  },
  {
    name: "nestjs",
    pkg: "example-with-nestjs",
    port: 3115,
    mount: "/jobs",
    command: ["bun", "run", "--filter", "example-with-nestjs", "start"],
    readyMatch: /listening on/i,
  },
];

const TIMEOUT_MS = 60_000;

async function main() {
  const filter = process.argv.slice(2);
  const targets = filter.length
    ? EXAMPLES.filter((e) => filter.includes(e.name))
    : EXAMPLES;

  if (filter.length && targets.length === 0) {
    console.error(
      `No matching examples for filter ${JSON.stringify(filter)}. Available: ${EXAMPLES.map((e) => e.name).join(", ")}`,
    );
    process.exit(1);
  }

  let failed = 0;
  for (const spec of targets) {
    try {
      await runOne(spec);
      console.log(`✓ ${spec.name}`);
    } catch (err) {
      failed++;
      console.error(`✗ ${spec.name}: ${(err as Error).message}`);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} of ${targets.length} smoke tests failed`);
    process.exit(1);
  }
  console.log(`\nAll ${targets.length} smoke tests passed.`);
}

async function runOne(spec: ExampleSpec): Promise<void> {
  if (spec.setup) {
    await runOnce(spec.setup, `${spec.name}:setup`);
  }

  const env = {
    ...process.env,
    PORT: String(spec.port),
    NODE_ENV: "production",
  };

  const child = spawn(spec.command[0]!, spec.command.slice(1), {
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  const buffer: string[] = [];
  child.stdout.on("data", (chunk) => buffer.push(chunk.toString()));
  child.stderr.on("data", (chunk) => buffer.push(chunk.toString()));

  try {
    await waitForReady(spec, child, buffer);
    await assertEndpoints(spec);
  } finally {
    await killTree(child);
  }
}

async function runOnce(cmd: string[], label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd[0]!, cmd.slice(1), { stdio: "inherit" });
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}

async function waitForReady(
  spec: ExampleSpec,
  child: ChildProcessWithoutNullStreams,
  buffer: string[],
): Promise<void> {
  const deadline = Date.now() + TIMEOUT_MS;

  // Race: process exits, ready log fires, or HTTP comes up.
  let resolved = false;
  let onExit: (() => void) | null = null;
  const exited = new Promise<never>((_, reject) => {
    onExit = () => {
      if (!resolved) reject(new Error(`process exited\n${buffer.join("")}`));
    };
    child.on("exit", onExit);
  });

  const ready = (async () => {
    while (Date.now() < deadline) {
      if (buffer.join("").match(spec.readyMatch)) return;
      if (await tryHealth(spec.port, spec.mount)) return;
      await sleep(250);
    }
    throw new Error(
      `timed out after ${TIMEOUT_MS / 1000}s\n${buffer.join("")}`,
    );
  })();

  try {
    await Promise.race([exited, ready]);
  } finally {
    resolved = true;
    if (onExit) child.off("exit", onExit);
  }
}

async function tryHealth(port: number, mount: string): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}${mount}/api/overview`);
    return res.ok;
  } catch {
    return false;
  }
}

async function assertEndpoints(spec: ExampleSpec): Promise<void> {
  const base = `http://localhost:${spec.port}${spec.mount}`;

  const overview = await fetchJson(`${base}/api/overview`);
  if (!Array.isArray((overview as { queues: unknown[] }).queues)) {
    throw new Error("/api/overview missing `queues` array");
  }
  if (typeof (overview as { totalJobs: unknown }).totalJobs !== "number") {
    throw new Error("/api/overview missing numeric `totalJobs`");
  }

  const queues = await fetchJson(`${base}/api/queues`);
  if (!Array.isArray(queues)) {
    throw new Error("/api/queues did not return an array");
  }

  const html = await fetchText(`${base}/`);
  if (!html.includes(`<base href="${spec.mount}/"`)) {
    throw new Error(
      `index.html missing <base href="${spec.mount}/"> (got: ${html.slice(0, 200)})`,
    );
  }

  // Deep client route should still resolve through the catch-all.
  const deepHtml = await fetchText(`${base}/queues/email`);
  if (!deepHtml.includes(`<base href="${spec.mount}/"`)) {
    throw new Error(`deep route did not return dashboard HTML`);
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.text();
}

async function killTree(child: ChildProcessWithoutNullStreams): Promise<void> {
  if (child.pid === undefined) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  await Promise.race([
    new Promise<void>((resolve) => child.on("exit", () => resolve())),
    sleep(2000),
  ]);
  if (child.exitCode === null) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      child.kill("SIGKILL");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
