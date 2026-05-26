import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  // No .d.ts — this package only ships an executable, not a library import surface.
  dts: false,
  sourcemap: false,
  clean: true,
  target: "node18",
  outDir: "dist",
  // The shebang is what makes the bundled output runnable via `npx workbench-mcp`
  // and via the `bin` entry in package.json. Matches `@getworkbench/cli`.
  banner: {
    js: "#!/usr/bin/env node",
  },
});
