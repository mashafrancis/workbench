import { readFileSync, writeFileSync } from "node:fs";
import { addImport, workbenchOptionsSnippet } from "./shared";
import type { Injector } from "./types";

/**
 * Inject a Workbench mount into a NestJS `main.ts` entry file.
 *
 *   await workbench(app, "<mount>", { queues: [...], auth: {...} });
 *
 * The call is inserted immediately before `app.listen(...)` and the
 * `await` keyword is added in front of the `NestFactory.create(...)`
 * call when the user kept it bare (so `app` is a real instance).
 */
export const injectNestjs: Injector = async ({
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

  if (src.includes("@getworkbench/nestjs")) {
    return { ok: false, reason: "already imports @getworkbench/nestjs" };
  }

  const appVar = src.match(
    /(?:const|let|var)\s+(\w+)\s*=\s*await\s+NestFactory\s*\.\s*create\s*\(/,
  )?.[1];
  if (!appVar) {
    return {
      ok: false,
      reason:
        "could not find `const app = await NestFactory.create(...)` declaration",
    };
  }

  const importLine = `import { workbench } from "@getworkbench/nestjs";\n`;
  const mountLine = `\n  await workbench(${appVar}, "${mountPath}", {\n${workbenchOptionsSnippet(
    withAuth,
    "    ",
  )}\n  });\n`;

  let updated = addImport(src, importLine, "@nestjs/core");

  const listenMatch =
    updated.match(new RegExp(`\\n\\s*await\\s+${appVar}\\.listen\\s*\\(`)) ??
    updated.match(new RegExp(`\\n\\s*${appVar}\\.listen\\s*\\(`));
  if (listenMatch && listenMatch.index !== undefined) {
    updated =
      updated.slice(0, listenMatch.index) +
      mountLine +
      updated.slice(listenMatch.index);
  } else {
    return {
      ok: false,
      reason: `could not find \`${appVar}.listen(...)\` call`,
    };
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
