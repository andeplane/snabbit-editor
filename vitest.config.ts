import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 20000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "server/**/*.ts"],
      exclude: ["**/*.d.ts"],
      reporter: ["text", "json", "json-summary", "html"],
      thresholds: { lines: 98, statements: 98, functions: 98, branches: 98 },
    },
  },
});
