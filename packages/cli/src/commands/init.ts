import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  note,
  outro,
  spinner,
  text,
} from "@clack/prompts";
import pc from "picocolors";
import { detectFramework, type Framework } from "../lib/framework-detect.js";
import { INJECTORS } from "../lib/inject/index.js";
import { detectPackageManager, installDep } from "../lib/package-manager.js";
import { generatePassword } from "../lib/password.js";

export interface InitOptions {
  cwd: string;
  mount: string;
  auth: boolean;
  docker: boolean;
  yes: boolean;
}

const FRAMEWORK_LABEL: Record<Framework, string> = {
  hono: "Hono",
  elysia: "Elysia",
  express: "Express",
  fastify: "Fastify",
  next: "Next.js",
  nestjs: "NestJS",
};

const FRAMEWORK_PACKAGE: Record<Framework, string> = {
  hono: "@getworkbench/hono",
  elysia: "@getworkbench/elysia",
  express: "@getworkbench/express",
  fastify: "@getworkbench/fastify",
  next: "@getworkbench/next",
  nestjs: "@getworkbench/nestjs",
};

export async function init(opts: InitOptions): Promise<void> {
  const cwd = resolve(opts.cwd);

  console.log();
  intro(pc.bgCyan(pc.black(" Workbench ")));

  const pkgJsonPath = join(cwd, "package.json");
  if (!existsSync(pkgJsonPath)) {
    cancel(
      `No package.json found in ${pc.cyan(cwd)}. Run this inside your project root.`,
    );
    process.exit(1);
  }

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as {
    name?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const deps = {
    ...(pkgJson.dependencies ?? {}),
    ...(pkgJson.devDependencies ?? {}),
  };

  const detected = await detectFramework(cwd, deps);
  if (!detected) {
    log.warn(
      `Workbench ships adapters for ${pc.bold(
        "Hono, Elysia, Express, Fastify, NestJS, and Next.js",
      )}. Add one of them to your project and re-run ${pc.cyan(
        "npx @getworkbench/cli init",
      )}.`,
    );
    cancel("no supported framework detected");
    process.exit(1);
  }

  const adapterPkg = FRAMEWORK_PACKAGE[detected.framework];
  const frameworkLabel = FRAMEWORK_LABEL[detected.framework];

  log.info(
    `Project: ${pc.cyan(pkgJson.name ?? relative(process.cwd(), cwd))} (${pc.bold(
      frameworkLabel,
    )})`,
  );

  let mountPath = opts.mount;
  let enableAuth = opts.auth;
  let writeDocker = opts.docker;

  if (!opts.yes) {
    const mountAnswer = await text({
      message: "Mount path for the dashboard",
      initialValue: mountPath,
      placeholder: "/jobs",
      validate(value) {
        if (!value.startsWith("/")) return "Must start with /";
      },
    });
    if (isCancel(mountAnswer)) return cancelAndExit();
    mountPath = mountAnswer as string;

    const authAnswer = await confirm({
      message: "Protect the dashboard with basic auth?",
      initialValue: enableAuth,
    });
    if (isCancel(authAnswer)) return cancelAndExit();
    enableAuth = authAnswer as boolean;

    if (!existsSync(join(cwd, "docker-compose.yml"))) {
      const dockerAnswer = await confirm({
        message: "Write a docker-compose.yml for Redis?",
        initialValue: writeDocker,
      });
      if (isCancel(dockerAnswer)) return cancelAndExit();
      writeDocker = dockerAnswer as boolean;
    } else {
      writeDocker = false;
    }
  }

  const pm = detectPackageManager(cwd);
  log.info(`Detected package manager: ${pc.cyan(pm)}`);

  const s = spinner();
  s.start(`Installing ${pc.bold(adapterPkg)}`);
  try {
    await installDep(pm, adapterPkg, cwd);
    s.stop(`Installed ${pc.bold(adapterPkg)}`);
  } catch (err) {
    s.stop(pc.red("Install failed"));
    log.error(String(err));
    process.exit(1);
  }

  const injector = INJECTORS[detected.framework];
  const injection = await injector({
    cwd,
    entry: detected.entry,
    mountPath,
    withAuth: enableAuth,
  });

  if (injection.ok) {
    const rel = injection.path ? relative(cwd, injection.path) : "your app";
    log.success(`Added Workbench mount to ${pc.cyan(rel)}`);
  } else if (detected.entry === null && detected.framework !== "next") {
    log.warn(
      "Could not locate an entrypoint. Add the mount manually — see the snippet below.",
    );
  } else {
    const rel = detected.entry ? relative(cwd, detected.entry) : "your app";
    log.warn(
      `Couldn't auto-edit ${pc.cyan(rel)} (${injection.reason}). Add the snippet below manually.`,
    );
  }

  const envExample = join(cwd, ".env.example");
  const envEntries: string[] = [];
  if (enableAuth) {
    const password = generatePassword(24);
    envEntries.push(
      "# Workbench dashboard auth",
      "WORKBENCH_USER=admin",
      `WORKBENCH_PASS=${password}`,
    );
  }
  envEntries.push(
    "# BullMQ Redis connection",
    "REDIS_URL=redis://localhost:6379",
  );

  const envBlock = `\n${envEntries.join("\n")}\n`;
  if (existsSync(envExample)) {
    const current = readFileSync(envExample, "utf-8");
    if (!current.includes("WORKBENCH_USER")) {
      writeFileSync(envExample, current.trimEnd() + envBlock);
      log.success(`Appended Workbench vars to ${pc.cyan(".env.example")}`);
    }
  } else {
    writeFileSync(envExample, envBlock.trimStart());
    log.success(`Wrote ${pc.cyan(".env.example")}`);
  }

  if (writeDocker) {
    writeFileSync(
      join(cwd, "docker-compose.yml"),
      `services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - workbench_redis:/data

volumes:
  workbench_redis:
`,
    );
    log.success(`Wrote ${pc.cyan("docker-compose.yml")}`);
  }

  note(snippetFor(detected.framework, mountPath, enableAuth), "Next steps");

  outro(pc.green("Workbench is ready."));
}

function snippetFor(
  framework: Framework,
  mountPath: string,
  withAuth: boolean,
): string {
  const authLine = withAuth
    ? pc.dim(
        "    auth: { username: process.env.WORKBENCH_USER!, password: process.env.WORKBENCH_PASS! },",
      )
    : null;

  switch (framework) {
    case "hono":
      return [
        "Add your BullMQ queues to the mount:",
        "",
        pc.dim('  import { workbench } from "@getworkbench/hono";'),
        pc.dim(`  app.route("${mountPath}", workbench({`),
        pc.dim("    queues: [/* your BullMQ Queue instances */],"),
        authLine,
        pc.dim("  }));"),
        "",
        `Dashboard will be live at ${pc.cyan(`http://localhost:PORT${mountPath}`)}`,
        `Docs & README: ${pc.cyan("https://getworkbench.dev")}`,
      ]
        .filter(Boolean)
        .join("\n");

    case "elysia":
      return [
        "Add your BullMQ queues to the mount:",
        "",
        pc.dim('  import { workbench } from "@getworkbench/elysia";'),
        pc.dim(`  app.mount("${mountPath}", workbench({`),
        pc.dim("    queues: [/* your BullMQ Queue instances */],"),
        pc.dim(`    basePath: "${mountPath}",`),
        authLine,
        pc.dim("  }));"),
        "",
        `Dashboard will be live at ${pc.cyan(`http://localhost:PORT${mountPath}`)}`,
        `Docs & README: ${pc.cyan("https://getworkbench.dev")}`,
      ]
        .filter(Boolean)
        .join("\n");

    case "express":
      return [
        "Add your BullMQ queues to the mount:",
        "",
        pc.dim('  import { workbench } from "@getworkbench/express";'),
        pc.dim(`  app.use("${mountPath}", workbench({`),
        pc.dim("    queues: [/* your BullMQ Queue instances */],"),
        authLine,
        pc.dim("  }));"),
        "",
        `Dashboard will be live at ${pc.cyan(`http://localhost:PORT${mountPath}`)}`,
        `Docs & README: ${pc.cyan("https://getworkbench.dev")}`,
      ]
        .filter(Boolean)
        .join("\n");

    case "fastify":
      return [
        "Add your BullMQ queues to the mount:",
        "",
        pc.dim('  import { workbench } from "@getworkbench/fastify";'),
        pc.dim(`  await app.register(workbench({`),
        pc.dim("    queues: [/* your BullMQ Queue instances */],"),
        authLine,
        pc.dim(`  }), { prefix: "${mountPath}" });`),
        "",
        `Dashboard will be live at ${pc.cyan(`http://localhost:PORT${mountPath}`)}`,
        `Docs & README: ${pc.cyan("https://getworkbench.dev")}`,
      ]
        .filter(Boolean)
        .join("\n");

    case "nestjs":
      return [
        "Open your main.ts and add your BullMQ queues to the mount:",
        "",
        pc.dim('  import { workbench } from "@getworkbench/nestjs";'),
        pc.dim(`  await workbench(app, "${mountPath}", {`),
        pc.dim("    queues: [/* your BullMQ Queue instances */],"),
        authLine,
        pc.dim("  });"),
        "",
        `Mount the call ${pc.bold("before")} ${pc.cyan("app.listen(...)")}.`,
        `Dashboard will be live at ${pc.cyan(`http://localhost:PORT${mountPath}`)}`,
        `Docs & README: ${pc.cyan("https://getworkbench.dev")}`,
      ]
        .filter(Boolean)
        .join("\n");

    case "next":
      return [
        "Edit the scaffolded route file and add your BullMQ queues:",
        "",
        pc.dim(`  app${mountPath}/[[...workbench]]/route.ts`),
        "",
        pc.dim('  import { Queue } from "bullmq";'),
        pc.dim('  import { workbench } from "@getworkbench/next";'),
        "",
        pc.dim("  const queues = [/* your BullMQ Queue instances */];"),
        "",
        pc.dim(
          "  export const { GET, POST, PUT, PATCH, DELETE } = workbench({",
        ),
        pc.dim("    queues,"),
        pc.dim(`    basePath: "${mountPath}",`),
        authLine,
        pc.dim("  });"),
        "",
        `Dashboard will be live at ${pc.cyan(`http://localhost:PORT${mountPath}`)}`,
        `Docs & README: ${pc.cyan("https://getworkbench.dev")}`,
      ]
        .filter(Boolean)
        .join("\n");
  }
}

function cancelAndExit(): void {
  cancel("Cancelled");
  process.exit(0);
}
