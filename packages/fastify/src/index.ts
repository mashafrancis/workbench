import {
  BASIC_AUTH_CHALLENGE,
  buildRouteTable,
  checkBasicAuth,
  renderIndexHtml,
  resolveBasePath,
  serveStaticAsset,
  WorkbenchCore,
  type WorkbenchOptions,
} from "@getworkbench/core";
import type { Queue } from "bullmq";
import type { FastifyPluginAsync, HTTPMethods } from "fastify";

/**
 * Mount the Workbench dashboard on a Fastify app as a plugin.
 *
 * Returns a `FastifyPluginAsync` so you register it with a `prefix`:
 *
 * @example
 * ```ts
 * import Fastify from "fastify";
 * import { Queue } from "bullmq";
 * import { workbench } from "@getworkbench/fastify";
 *
 * const app = Fastify();
 * const emailQueue = new Queue("email", {
 *   connection: { url: process.env.REDIS_URL! },
 * });
 *
 * await app.register(
 *   workbench({
 *     queues: [emailQueue],
 *     auth: {
 *       username: process.env.WORKBENCH_USER!,
 *       password: process.env.WORKBENCH_PASS!,
 *     },
 *   }),
 *   { prefix: "/jobs" },
 * );
 *
 * await app.listen({ port: 3000 });
 * ```
 *
 * Requires Fastify v5 or newer.
 */
export function workbench(
  options: WorkbenchOptions | Queue[],
): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (fastify) => {
    const core = new WorkbenchCore(options);

    if (core.requiresAuth()) {
      fastify.addHook("onRequest", async (req, reply) => {
        if (
          !checkBasicAuth(
            req.headers.authorization,
            core.options.auth!.username,
            core.options.auth!.password,
          )
        ) {
          reply
            .code(BASIC_AUTH_CHALLENGE.status)
            .header(
              "WWW-Authenticate",
              BASIC_AUTH_CHALLENGE.headers["WWW-Authenticate"],
            )
            .send(BASIC_AUTH_CHALLENGE.body);
          return reply;
        }
      });
    }

    fastify.addHook("onRequest", async (req, reply) => {
      if (req.url.includes("/api")) {
        reply.header("Access-Control-Allow-Origin", "*");
        reply.header(
          "Access-Control-Allow-Methods",
          "GET,HEAD,PUT,PATCH,POST,DELETE",
        );
        reply.header("Access-Control-Allow-Headers", "*");
      }
    });

    for (const route of buildRouteTable(core)) {
      fastify.route({
        method: route.method.toUpperCase() as HTTPMethods,
        url: `/api${route.path}`,
        handler: async (req, reply) => {
          try {
            const result = await route.handler({
              params: req.params as Record<string, string>,
              query: req.query as Record<string, string | undefined>,
              body: req.body,
            });
            reply.code(result.status).send(result.body);
          } catch (error) {
            reply.code(500).send({
              error:
                error instanceof Error
                  ? error.message
                  : "Internal server error",
            });
          }
        },
      });
    }

    fastify.get("/config", async () => core.getConfig());

    fastify.get<{ Params: { file: string } }>(
      "/assets/:file",
      async (req, reply) => {
        const asset = serveStaticAsset(req.params.file);
        if (asset.status === 404 || !asset.body) {
          reply.code(404).type("text/plain").send("Not found");
          return reply;
        }
        reply.code(200).type(asset.contentType).send(asset.body);
        return reply;
      },
    );

    fastify.get("/*", async (req, reply) => {
      const pathname = (req.url ?? "/").split("?")[0] ?? "/";
      const basePath = resolveBasePath(core.options.basePath, pathname);
      const html = renderIndexHtml(basePath, core.options.title || "Workbench");
      reply.code(200).type("text/html; charset=utf-8").send(html.body);
      return reply;
    });
  };

  return plugin;
}

export type { WorkbenchOptions } from "@getworkbench/core";
