import type { Framework } from "../framework-detect";
import { injectAdonis } from "./adonis";
import { injectAstro } from "./astro";
import { injectBun } from "./bun";
import { injectElysia } from "./elysia";
import { injectExpress } from "./express";
import { injectFastify } from "./fastify";
import { injectH3 } from "./h3";
import { injectHono } from "./hono";
import { injectKoa } from "./koa";
import { injectNestjs } from "./nestjs";
import { injectNext } from "./next";
import { injectNuxt } from "./nuxt";
import { injectTanstackStart } from "./tanstack-start";
import type { Injector } from "./types";

export const INJECTORS: Record<Framework, Injector> = {
  hono: injectHono,
  elysia: injectElysia,
  express: injectExpress,
  fastify: injectFastify,
  next: injectNext,
  nestjs: injectNestjs,
  koa: injectKoa,
  astro: injectAstro,
  nuxt: injectNuxt,
  bun: injectBun,
  h3: injectH3,
  adonis: injectAdonis,
  "tanstack-start": injectTanstackStart,
};

export type { InjectionResult, InjectorContext } from "./types";
