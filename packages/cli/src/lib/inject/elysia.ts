import { readFileSync, writeFileSync } from "node:fs";
import { addImport } from "./shared";
import type { Injector } from "./types";

/**
 * Inject a Workbench mount into an Elysia entry file.
 *
 *   app.mount("<mount>", workbench({ queues: [...], auth: {...} }));
 */
export const injectElysia: Injector = async ({
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

  if (src.includes("@getworkbench/elysia")) {
    return { ok: false, reason: "already imports @getworkbench/elysia" };
  }

  const appVar = src.match(
    /(?:const|let|var)\s+(\w+)\s*=\s*new\s+Elysia\s*\(/,
  )?.[1];
  if (!appVar) {
    return { ok: false, reason: "could not determine Elysia variable name" };
  }

  const importLine = `import { workbench } from "@getworkbench/elysia";\n`;
  const mountLine = `\n${appVar}.mount("${mountPath}", workbench({\n  queues: [/* add your BullMQ queues */],\n  basePath: "${mountPath}",${
    withAuth
      ? `\n  auth: {\n    username: process.env.WORKBENCH_USER!,\n    password: process.env.WORKBENCH_PASS!,\n  },`
      : ""
  }\n}));\n`;

  let updated = addImport(src, importLine, "elysia");

  const listenMatch = updated.match(
    new RegExp(`\\n\\s*${appVar}\\.listen\\s*\\(`),
  );
  if (listenMatch && listenMatch.index !== undefined) {
    updated =
      updated.slice(0, listenMatch.index) +
      mountLine +
      updated.slice(listenMatch.index);
  } else {
    const exportMatch = updated.match(
      new RegExp(`\\n\\s*export\\s+default\\s+${appVar}\\s*;?`),
    );
    if (exportMatch && exportMatch.index !== undefined) {
      updated =
        updated.slice(0, exportMatch.index) +
        mountLine +
        updated.slice(exportMatch.index);
    } else {
      if (!updated.endsWith("\n")) updated += "\n";
      updated += mountLine;
    }
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
