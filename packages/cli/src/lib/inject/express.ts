import { readFileSync, writeFileSync } from "node:fs";
import { addImport, workbenchOptionsSnippet } from "./shared";
import type { Injector } from "./types";

/**
 * Inject a Workbench mount into an Express entry file.
 *
 *   app.use("<mount>", workbench({ queues: [...], auth: {...} }));
 */
export const injectExpress: Injector = async ({
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

  if (src.includes("@getworkbench/express")) {
    return { ok: false, reason: "already imports @getworkbench/express" };
  }

  const appVar =
    src.match(/(?:const|let|var)\s+(\w+)\s*=\s*express\s*\(\s*\)/)?.[1] ??
    src.match(
      /(?:const|let|var)\s+(\w+)\s*=\s*new\s+(?:Express|express)\s*\(/,
    )?.[1];
  if (!appVar) {
    return { ok: false, reason: "could not determine Express variable name" };
  }

  const importLine = `import { workbench } from "@getworkbench/express";\n`;
  const mountLine = `\n${appVar}.use("${mountPath}", workbench({\n${workbenchOptionsSnippet(
    withAuth,
  )}\n}));\n`;

  let updated = addImport(src, importLine, "express");

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
