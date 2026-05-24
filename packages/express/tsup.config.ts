import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: false,
  target: "node18",
  outDir: "dist",
  external: ["@getworkbench/core", "bullmq", "express"],
});
