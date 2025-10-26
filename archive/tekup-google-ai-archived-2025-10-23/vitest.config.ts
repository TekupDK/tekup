import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        // Exclude frontend/client tests from root run. Frontend has its own Vitest config.
        exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "client/**",
        ],
        coverage: {
            reporter: ["text", "html"],
        },
    },
});
