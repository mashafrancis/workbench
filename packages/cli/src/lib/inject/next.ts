import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Injector } from "./types";

/**
 * Scaffold a Next.js App Router catch-all route file for Workbench.
 *
 * Writes `app/<mount>/[[...workbench]]/route.ts` (or `src/app/...` when the
 * project uses the `src/` layout). Always creates the file; never edits the
 * user's existing entry.
 */
export const injectNext: Injector = async ({ cwd, mountPath, withAuth }) => {
  const appBase = existsSync(join(cwd, "src/app"))
    ? "src/app"
    : existsSync(join(cwd, "app"))
      ? "app"
      : null;

  if (!appBase) {
    return {
      ok: false,
      reason:
        "no Next.js app/ directory found (pages router is not supported by @getworkbench/next)",
    };
  }

  const segments = mountPath.split("/").filter(Boolean);
  const dir = join(cwd, appBase, ...segments, "[[...workbench]]");
  const file = join(dir, "route.ts");

  if (existsSync(file)) {
    return { ok: false, reason: `${file} already exists` };
  }

  const contents = `import { Queue } from "bullmq";
import { workbench } from "@getworkbench/next";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };

// TODO: replace with your real BullMQ queue instances.
const queues: Queue[] = [
  // new Queue("email", { connection }),
];

export const { GET, POST, PUT, PATCH, DELETE } = workbench({
  queues,
  basePath: "${mountPath}",${
    withAuth
      ? `\n  auth: {\n    username: process.env.WORKBENCH_USER!,\n    password: process.env.WORKBENCH_PASS!,\n  },`
      : ""
  }
});
`;

  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, contents);
    return { ok: true, path: file };
  } catch (err) {
    return { ok: false, reason: `could not write file: ${err}` };
  }
};
