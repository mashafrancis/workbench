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
  | "nestjs"
  | "koa"
  | "astro"
  | "nuxt"
  | "bun"
  | "h3"
  | "adonis"
  | "tanstack-start";

/**
 * Frameworks whose entry file we edit in place. Next.js, Astro, and Nuxt
 * scaffold a route file instead of editing user code, so they don't need a
 * source regex.
 */
type EditableFramework = Exclude<
  Framework,
  "next" | "astro" | "nuxt" | "tanstack-start"
>;

const FRAMEWORK_REGEX: Record<EditableFramework, RegExp> = {
  hono: /new\s+Hono\s*\(/,
  elysia: /new\s+Elysia\s*\(/,
  fastify:
    /(?:require\s*\(\s*["']fastify["']\s*\)|from\s+["']fastify["']|Fastify\s*\(\s*\)?)/,
  express:
    /(?:require\s*\(\s*["']express["']\s*\)|from\s+["']express["']|express\s*\(\s*\))/,
  nestjs: /NestFactory\s*\.\s*create\s*\(/,
  koa: /(?:require\s*\(\s*["']koa["']\s*\)|from\s+["']koa["']|new\s+Koa\s*\()/,
  bun: /Bun\s*\.\s*serve\s*\(/,
  h3: /(?:from\s+["']h3["']|require\s*\(\s*["']h3["']\s*\)|createApp\s*\(|toNodeListener\s*\()/,
};

/**
 * Each framework's authoritative npm package name in `package.json`.
 * For Bun we accept either `@types/bun` or `bun-types` since the runtime
 * itself isn't an npm dep.
 */
const PACKAGE_NAMES: Record<Framework, string | string[]> = {
  hono: "hono",
  elysia: "elysia",
  fastify: "fastify",
  express: "express",
  next: "next",
  nestjs: "@nestjs/core",
  koa: "koa",
  astro: "astro",
  nuxt: "nuxt",
  bun: ["@types/bun", "bun-types"],
  h3: "h3",
  adonis: "@adonisjs/core",
  "tanstack-start": "@tanstack/react-start",
};

/**
 * Detection order matters: higher-level frameworks come first so that a
 * Nuxt project (which has h3 transitively) isn't reported as h3, etc.
 */
const DETECTION_PRIORITY: Framework[] = [
  "next",
  "tanstack-start",
  "nuxt",
  "astro",
  "adonis",
  "nestjs",
  "elysia",
  "fastify",
  "express",
  "koa",
  "hono",
  "h3",
  "bun",
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
    if (!hasDep(deps, PACKAGE_NAMES[framework])) continue;

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

    if (framework === "astro") {
      if (existsSync(join(cwd, "src/pages"))) {
        return { framework, entry: null };
      }
      continue;
    }

    if (framework === "nuxt") {
      // Nuxt projects always have a top-level nuxt.config.* — that's a
      // stronger signal than the `nuxt` dep alone (which a few unrelated
      // tools also pull in transitively).
      const hasConfig = ["nuxt.config.ts", "nuxt.config.js", "nuxt.config.mjs"]
        .map((f) => join(cwd, f))
        .some(existsSync);
      if (hasConfig) {
        return { framework, entry: null };
      }
      continue;
    }

    if (framework === "tanstack-start") {
      const hasRoutesDir = existsSync(join(cwd, "src/routes"));
      const hasTanstackPlugin =
        existsSync(join(cwd, "vite.config.ts")) &&
        (await fileContains(join(cwd, "vite.config.ts"), "tanstackStart"));
      if (hasRoutesDir && hasTanstackPlugin) {
        return { framework, entry: null };
      }
      continue;
    }

    if (framework === "adonis") {
      const hasRoutes = existsSync(join(cwd, "start/routes.ts"));
      const hasAdonisRc =
        existsSync(join(cwd, "adonisrc.ts")) ||
        existsSync(join(cwd, "adonisrc.js"));
      if (hasRoutes || hasAdonisRc) {
        return { framework, entry: join(cwd, "start/routes.ts") };
      }
      continue;
    }

    const entry = await findFrameworkEntry(cwd, framework);
    if (entry) return { framework, entry };
  }

  return null;
}

async function fileContains(path: string, needle: string): Promise<boolean> {
  try {
    const content = await readFile(path, "utf-8");
    return content.includes(needle);
  } catch {
    return false;
  }
}

function hasDep(
  deps: Record<string, string>,
  names: string | string[],
): boolean {
  if (typeof names === "string") return Boolean(deps[names]);
  return names.some((name) => Boolean(deps[name]));
}

async function findFrameworkEntry(
  cwd: string,
  framework: EditableFramework,
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
