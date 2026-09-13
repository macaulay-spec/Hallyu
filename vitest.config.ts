import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests for Hallyu's pure server logic (spoiler engine, etc.).
// Convex server functions with ctx are integration-tested via the live
// backend queries in milestone smoke checks, not vitest.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
