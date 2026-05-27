import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { addImport, workbenchOptionsSnippet } from "./shared";
import type { Injector } from "./types";

/**
 * Inject a Workbench mount into `start/routes.ts`.
 *
 *   mountWorkbench(router, "<mount>", { queues: [...], auth: {...} });
 */
export const injectAdonis: Injector = async ({ cwd, mountPath, withAuth }) => {
  const routesFile = join(cwd, "start/routes.ts");
  let src: string;
  try {
    src = readFileSync(routesFile, "utf-8");
  } catch (err) {
    return { ok: false, reason: `could not read start/routes.ts: ${err}` };
  }

  if (src.includes("@getworkbench/adonis")) {
    return { ok: false, reason: "already imports @getworkbench/adonis" };
  }

  const importLine = `import { mountWorkbench } from "@getworkbench/adonis";\n`;
  const mountLine = `\nmountWorkbench(router, "${mountPath}", {\n${workbenchOptionsSnippet(
    withAuth,
  )}\n});\n`;

  let updated = addImport(src, importLine, "@adonisjs/core/services/router");
  if (!updated.includes("import router from")) {
    updated = addImport(
      updated,
      `import router from "@adonisjs/core/services/router";\n`,
    );
  }

  if (!updated.endsWith("\n")) updated += "\n";
  updated += mountLine;

  try {
    writeFileSync(routesFile, updated);
    return { ok: true, path: routesFile };
  } catch (err) {
    return { ok: false, reason: `could not write file: ${err}` };
  }
};
