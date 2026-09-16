#!/usr/bin/env node
/**
 * Driver: bundle the static renderer (swapping react-native for the shim) and
 * run it, writing PNG previews of every coded screen to docs/design-previews/.
 *
 *   npm run design:render
 */
import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../");
const BUILD = path.join(HERE, ".build");
fs.mkdirSync(BUILD, { recursive: true });

const shim = (f) => path.join(HERE, "shim", f);

await esbuild.build({
  entryPoints: [path.join(HERE, "render-entry.tsx")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  jsx: "automatic",
  outfile: path.join(BUILD, "render.mjs"),
  alias: {
    "react-native": shim("react-native.tsx"),
    "expo-linear-gradient": shim("linear-gradient.tsx"),
    "@expo/vector-icons": shim("vector-icons.tsx"),
  },
  external: ["react", "react/jsx-runtime", "react-test-renderer", "satori", "sharp", "@resvg/resvg-js"],
  logLevel: "warning",
});

const res = spawnSync(process.execPath, [path.join(BUILD, "render.mjs")], {
  stdio: "inherit",
  cwd: ROOT,
});
process.exit(res.status ?? 1);
