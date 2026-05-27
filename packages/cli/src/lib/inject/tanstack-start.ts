import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Injector } from "./types";

/**
 * Scaffold TanStack Start server routes for Workbench.
 *
 * TanStack Start matches splat routes separately from the bare mount, so we
 * scaffold three files:
 *
 *   src/lib/workbench-handlers.ts   — shared handler export
 *   src/routes/<mount>.ts           — handles `/<mount>` and `/<mount>/`
 *   src/routes/<mount>/$.ts         — handles `/<mount>/<anything>`
 */
export const injectTanstackStart: Injector = async ({
  cwd,
  mountPath,
  withAuth,
}) => {
  const segments = mountPath.split("/").filter(Boolean);
  if (segments.length === 0) {
    return { ok: false, reason: "mountPath must have at least one segment" };
  }

  const routesBase = join(cwd, "src/routes");
  const libBase = join(cwd, "src/lib");
  const sharedFile = join(libBase, "workbench-handlers.ts");
  const baseRouteFile = join(routesBase, `${segments.join("/")}.ts`);
  const catchallRouteFile = join(routesBase, ...segments, "$.ts");

  if (
    existsSync(sharedFile) ||
    existsSync(baseRouteFile) ||
    existsSync(catchallRouteFile)
  ) {
    return {
      ok: false,
      reason: `one of ${sharedFile}, ${baseRouteFile}, ${catchallRouteFile} already exists`,
    };
  }

  const sharedContents = `import { Queue } from "bullmq";
import { workbench } from "@getworkbench/tanstack-start";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };

// TODO: replace with your real BullMQ queue instances.
const queues: Queue[] = [
  // new Queue("email", { connection }),
];

export const workbenchHandlers = workbench({
  queues,
  basePath: "${mountPath}",${
    withAuth
      ? `\n  auth: {\n    username: process.env.WORKBENCH_USER!,\n    password: process.env.WORKBENCH_PASS!,\n  },`
      : ""
  }
});
`;

  const routePath = `/${segments.join("/")}`;
  const splatRoutePath = `${routePath}/$`;
  const baseImportPath = `${"../".repeat(segments.length)}lib/workbench-handlers`;
  const catchallImportPath = `${"../".repeat(segments.length + 1)}lib/workbench-handlers`;

  const baseRouteContents = `import { createFileRoute } from "@tanstack/react-router";
import { workbenchHandlers } from "${baseImportPath}";

export const Route = createFileRoute("${routePath}")({
  server: {
    handlers: workbenchHandlers,
  },
});
`;

  const catchallRouteContents = `import { createFileRoute } from "@tanstack/react-router";
import { workbenchHandlers } from "${catchallImportPath}";

export const Route = createFileRoute("${splatRoutePath}")({
  server: {
    handlers: workbenchHandlers,
  },
});
`;

  try {
    mkdirSync(libBase, { recursive: true });
    writeFileSync(sharedFile, sharedContents);
    mkdirSync(join(routesBase, ...segments), { recursive: true });
    writeFileSync(baseRouteFile, baseRouteContents);
    writeFileSync(catchallRouteFile, catchallRouteContents);
    return { ok: true, path: catchallRouteFile };
  } catch (err) {
    return { ok: false, reason: `could not write file: ${err}` };
  }
};
