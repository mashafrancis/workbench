import {
  BASIC_AUTH_CHALLENGE,
  buildRouteTable,
  checkBasicAuth,
  renderIndexHtml,
  resolveBasePath,
  serveStaticAsset,
  serveUiFile,
  WorkbenchCore,
  type WorkbenchOptions,
} from "@getworkbench/core";
import type { Queue } from "bullmq";
import express, { type Router } from "express";

/**
 * Mount the Workbench dashboard on an Express app.
 *
 * Returns an Express `Router` so it composes with `app.use("/path", router)`.
 *
 * @example
 * ```ts
 * import express from "express";
 * import { Queue } from "bullmq";
 * import { workbench } from "@getworkbench/express";
 *
 * const app = express();
 * const emailQueue = new Queue("email", {
 *   connection: { url: process.env.REDIS_URL! },
 * });
 *
 * app.use(
 *   "/jobs",
 *   workbench({
 *     queues: [emailQueue],
 *     auth: {
 *       username: process.env.WORKBENCH_USER!,
 *       password: process.env.WORKBENCH_PASS!,
 *     },
 *   }),
 * );
 *
 * app.listen(3000);
 * ```
 */
export function workbench(options: WorkbenchOptions | Queue[]): Router {
  const core = new WorkbenchCore(options);
  const router = express.Router();

  if (core.requiresAuth()) {
    router.use((req, res, next) => {
      if (
        !checkBasicAuth(
          req.headers.authorization,
          core.options.auth!.username,
          core.options.auth!.password,
        )
      ) {
        res.set(BASIC_AUTH_CHALLENGE.headers);
        res.status(BASIC_AUTH_CHALLENGE.status).send(BASIC_AUTH_CHALLENGE.body);
        return;
      }
      next();
    });
  }

  router.use("/api", (_req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
    res.set("Access-Control-Allow-Headers", "*");
    next();
  });

  router.use("/api", express.json());

  for (const route of buildRouteTable(core)) {
    router[route.method](`/api${route.path}`, async (req, res) => {
      try {
        const result = await route.handler({
          params: req.params as Record<string, string>,
          query: req.query as Record<string, string | undefined>,
          body: req.body,
        });
        res.status(result.status).json(result.body);
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error ? error.message : "Internal server error",
        });
      }
    });
  }

  router.get("/config", (_req, res) => {
    res.json(core.getConfig());
  });

  router.get("/assets/:file", (req, res) => {
    const asset = serveStaticAsset(req.params.file as string);
    if (asset.status === 404 || !asset.body) {
      res.status(404).type("text/plain").send("Not found");
      return;
    }
    res.status(200).type(asset.contentType).send(asset.body);
  });

  router.get("/app-icon.svg", (_req, res) => {
    const asset = serveUiFile("app-icon.svg");
    if (asset.status === 404 || !asset.body) {
      res.status(404).type("text/plain").send("Not found");
      return;
    }
    res.status(200).type(asset.contentType).send(asset.body);
  });

  router.use((req, res, next) => {
    if (req.method !== "GET") {
      next();
      return;
    }
    const pathname = (req.originalUrl ?? req.url).split("?")[0] ?? "/";
    const basePath = resolveBasePath(core.options.basePath, pathname);
    const html = renderIndexHtml(basePath, core.options.title || "Workbench");
    res.status(200).type("text/html; charset=utf-8").send(html.body);
  });

  return router;
}

export type { WorkbenchOptions } from "@getworkbench/core";
