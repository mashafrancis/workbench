import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fg from "fast-glob";

export type Framework =
  | "hono"
  | "elysia"
  | "express"
  | "fastify"
  | "next"
  | "nestjs";

const FRAMEWORK_REGEX: Record<Exclude<Framework, "next">, RegExp> = {
  hono: /new\s+Hono\s*\(/,
  elysia: /new\s+Elysia\s*\(/,
  fastify:
    /(?:require\s*\(\s*["']fastify["']\s*\)|from\s+["']fastify["']|Fastify\s*\(\s*\)?)/,
  express:
    /(?:require\s*\(\s*["']express["']\s*\)|from\s+["']express["']|express\s*\(\s*\))/,
  nestjs: /NestFactory\s*\.\s*create\s*\(/,
};

const PACKAGE_NAMES: Record<Framework, string> = {
  hono: "hono",
  elysia: "elysia",
  fastify: "fastify",
  express: "express",
  next: "next",
  nestjs: "@nestjs/core",
};

const DETECTION_PRIORITY: Framework[] = [
  "next",
  "nestjs",
  "elysia",
  "fastify",
  "express",
  "hono",
];

export interface DetectionResult {
  framework: Framework;
  /** Source file containing the framework's constructor (null for Next.js). */
  entry: string | null;
}

/**
 * Detect which supported framework the user's project uses.
 *
 * Strategy:
 * 1. Look at `package.json` deps; pick the highest-priority framework with a
 *    matching dep.
 * 2. For Next.js, confirm by checking for an `app/` or `pages/` directory.
 * 3. For others, scan source files for the framework's constructor as a
 *    secondary signal and to find the entry file the CLI will edit.
 *
 * Returns `null` when no supported framework is found.
 */
export async function detectFramework(
  cwd: string,
  deps: Record<string, string>,
): Promise<DetectionResult | null> {
  for (const framework of DETECTION_PRIORITY) {
    if (!deps[PACKAGE_NAMES[framework]]) continue;

    if (framework === "next") {
      const hasAppDir = existsSync(join(cwd, "app"));
      const hasSrcAppDir = existsSync(join(cwd, "src/app"));
      const hasPagesDir = existsSync(join(cwd, "pages"));
      const hasSrcPagesDir = existsSync(join(cwd, "src/pages"));
      if (hasAppDir || hasSrcAppDir || hasPagesDir || hasSrcPagesDir) {
        return { framework, entry: null };
      }
      continue;
    }

    const entry = await findFrameworkEntry(cwd, framework);
    if (entry) return { framework, entry };
  }

  return null;
}

async function findFrameworkEntry(
  cwd: string,
  framework: Exclude<Framework, "next">,
): Promise<string | null> {
  const regex = FRAMEWORK_REGEX[framework];
  const files = await fg(
    ["src/**/*.{ts,tsx,js,mjs}", "app/**/*.{ts,tsx,js,mjs}", "index.{ts,js}"],
    {
      cwd,
      absolute: true,
      ignore: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.next/**",
        "**/build/**",
      ],
    },
  );

  const matches: string[] = [];
  for (const file of files) {
    try {
      const content = await readFile(file, "utf-8");
      if (regex.test(content)) {
        matches.push(file);
      }
    } catch {
      // ignore unreadable files
    }
  }

  if (matches.length === 0) return null;
  matches.sort((a, b) => a.length - b.length);
  return matches[0]!;
}
