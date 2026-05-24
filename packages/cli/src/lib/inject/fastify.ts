import { readFileSync, writeFileSync } from "node:fs";
import { addImport, workbenchOptionsSnippet } from "./shared";
import type { Injector } from "./types";

/**
 * Inject a Workbench plugin registration into a Fastify entry file.
 *
 *   await app.register(workbench({ queues: [...], auth: {...} }), { prefix: "<mount>" });
 */
export const injectFastify: Injector = async ({
  entry,
  mountPath,
  withAuth,
}) => {
  if (!entry) return { ok: false, reason: "missing entry file" };

  let src: string;
  try {
    src = readFileSync(entry, "utf-8");
  } catch (err) {
    return { ok: false, reason: `could not read file: ${err}` };
  }

  if (src.includes("@getworkbench/fastify")) {
    return { ok: false, reason: "already imports @getworkbench/fastify" };
  }

  const appVar =
    src.match(/(?:const|let|var)\s+(\w+)\s*=\s*Fastify\s*\(/)?.[1] ??
    src.match(/(?:const|let|var)\s+(\w+)\s*=\s*fastify\s*\(/)?.[1];
  if (!appVar) {
    return { ok: false, reason: "could not determine Fastify variable name" };
  }

  const importLine = `import { workbench } from "@getworkbench/fastify";\n`;
  const registerLine = `\nawait ${appVar}.register(workbench({\n${workbenchOptionsSnippet(
    withAuth,
  )}\n}), { prefix: "${mountPath}" });\n`;

  let updated = addImport(src, importLine, "fastify");

  const listenMatch =
    updated.match(new RegExp(`\\n\\s*await\\s+${appVar}\\.listen\\s*\\(`)) ??
    updated.match(new RegExp(`\\n\\s*${appVar}\\.listen\\s*\\(`));
  if (listenMatch && listenMatch.index !== undefined) {
    updated =
      updated.slice(0, listenMatch.index) +
      registerLine +
      updated.slice(listenMatch.index);
  } else {
    if (!updated.endsWith("\n")) updated += "\n";
    updated += registerLine;
  }

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
