import { readFileSync, writeFileSync } from "node:fs";
import { addImport, workbenchOptionsSnippet } from "./shared";
import type { Injector } from "./types";

/**
 * Inject a Workbench mount into a Hono entry file.
 *
 *   app.route("<mount>", workbench({ queues: [...], auth: {...} }));
 */
export const injectHono: Injector = async ({ entry, mountPath, withAuth }) => {
  if (!entry) return { ok: false, reason: "missing entry file" };

  let src: string;
  try {
    src = readFileSync(entry, "utf-8");
  } catch (err) {
    return { ok: false, reason: `could not read file: ${err}` };
  }

  if (src.includes("@getworkbench/hono")) {
    return { ok: false, reason: "already imports @getworkbench/hono" };
  }

  const appVar = src.match(
    /(?:const|let|var)\s+(\w+)\s*=\s*new\s+Hono\s*\(/,
  )?.[1];
  if (!appVar) {
    return { ok: false, reason: "could not determine Hono variable name" };
  }

  const importLine = `import { workbench } from "@getworkbench/hono";\n`;
  const mountLine = `\n${appVar}.route("${mountPath}", workbench({\n${workbenchOptionsSnippet(
    withAuth,
  )}\n}));\n`;

  let updated = addImport(src, importLine, "hono");
  updated = addMountBeforeServeOrExport(updated, appVar, mountLine);

  if (updated === src) {
    return { ok: false, reason: "no safe insertion point" };
  }

  try {
    writeFileSync(entry, updated);
    return { ok: true, path: entry };
  } catch (err) {
    return { ok: false, reason: `could not write file: ${err}` };
  }
};

function addMountBeforeServeOrExport(
  src: string,
  appVar: string,
  mountLine: string,
): string {
  const serveMatch = src.match(/\n\s*serve\s*\(/);
  if (serveMatch && serveMatch.index !== undefined) {
    return (
      src.slice(0, serveMatch.index) + mountLine + src.slice(serveMatch.index)
    );
  }

  const bunServeMatch = src.match(/\n\s*Bun\.serve\s*\(/);
  if (bunServeMatch && bunServeMatch.index !== undefined) {
    return (
      src.slice(0, bunServeMatch.index) +
      mountLine +
      src.slice(bunServeMatch.index)
    );
  }

  const exportMatch = src.match(
    new RegExp(`\\n\\s*export\\s+default\\s+${appVar}\\s*;?`),
  );
  if (exportMatch && exportMatch.index !== undefined) {
    return (
      src.slice(0, exportMatch.index) + mountLine + src.slice(exportMatch.index)
    );
  }

  if (!src.endsWith("\n")) src += "\n";
  return src + mountLine;
}
