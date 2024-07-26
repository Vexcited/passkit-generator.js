import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  minify: "terser",
  target: "es2020",
  outDir: "dist",
  dts: true,
});
