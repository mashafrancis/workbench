import type { Framework } from "../framework-detect";
import { injectElysia } from "./elysia";
import { injectExpress } from "./express";
import { injectFastify } from "./fastify";
import { injectHono } from "./hono";
import { injectNestjs } from "./nestjs";
import { injectNext } from "./next";
import type { Injector } from "./types";

export const INJECTORS: Record<Framework, Injector> = {
  hono: injectHono,
  elysia: injectElysia,
  express: injectExpress,
  fastify: injectFastify,
  next: injectNext,
  nestjs: injectNestjs,
};

export type { InjectionResult, InjectorContext } from "./types";
