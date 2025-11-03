import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    // Plugin to handle CSS imports in tests - must come before other plugins
    {
      name: "css-mock",
      enforce: "pre",
      // Intercept ALL CSS imports before they reach the transformer
      load(id) {
        if (
          id.endsWith(".css") ||
          id.includes(".css?") ||
          id.includes("katex") ||
          id.includes("/.css")
        ) {
          // Return empty module for CSS files
          return "export default {}";
        }
      },
      resolveId(id, importer) {
        // Handle all CSS file resolution - be very aggressive
        if (
          id.endsWith(".css") ||
          id.includes(".css") ||
          id.includes("katex")
        ) {
          // Return virtual ID that load() handles
          return `\0css:${id}`;
        }
        return null;
      },
    },
  ],
  root: path.resolve(import.meta.dirname),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  ssr: {
    // Ensure Vite transforms problematic deps that import CSS (e.g., streamdown -> katex)
    // and don't externalize CSS files
    noExternal: ["streamdown", "katex", /\.css$/],
  },
  optimizeDeps: {
    // Exclude problematic CSS imports from optimization
    exclude: ["katex"],
    // Include streamdown to pre-bundle it (might help with CSS)
    include: ["streamdown"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/**/*.test.tsx",
      "client/**/*.spec.tsx",
    ],
    deps: {
      // Inline these dependencies so Vite transforms their CSS imports under test
      inline: ["streamdown", "katex"],
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/vitest.setup.ts",
      ],
    },
  },
});
