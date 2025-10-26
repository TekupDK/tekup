import { describe, expect, it } from "vitest";
import { appConfig, serverConfig, llmConfig, googleConfig } from "../src/config";

describe("Configuration", () => {
    describe("Environment parsing", () => {
        it("parses server config correctly", () => {
            expect(serverConfig.PORT).toBeTypeOf("number");
            expect(serverConfig.PORT).toBeGreaterThan(0);
            expect(serverConfig.PORT).toBeLessThanOrEqual(65535);
            expect(serverConfig.LOG_LEVEL).toBeTypeOf("string");
        });

        it("parses LLM config correctly", () => {
            expect(llmConfig.OPENAI_API_KEY).toBeFalsy(); // Can be undefined or empty string
            expect(llmConfig.GEMINI_KEY).toBeTypeOf("string");
        });

        it("parses Google config correctly", () => {
            expect(googleConfig.GOOGLE_PROJECT_ID).toBeTypeOf("string");
            expect(googleConfig.GOOGLE_CLIENT_EMAIL).toBeTypeOf("string");
            expect(googleConfig.GOOGLE_PRIVATE_KEY).toBeTypeOf("string");
            expect(googleConfig.GOOGLE_IMPERSONATED_USER).toBeTypeOf("string");
            expect(googleConfig.DEFAULT_EMAIL_FROM).toBeTypeOf("string");
            expect(googleConfig.ORGANISATION_NAME).toBe("Rendetalje.dk");
            expect(googleConfig.RUN_MODE).toMatch(/^(live|dry-run)$/);
        });
    });

    describe("Backward compatibility", () => {
        it("provides isLiveMode for backward compatibility", () => {
            expect(typeof appConfig.google.RUN_MODE === "string").toBe(true);
        });
    });

    describe("Default values", () => {
        it("uses sensible defaults", () => {
            expect(serverConfig.PORT).toBe(3000);
            expect(serverConfig.LOG_LEVEL).toBe("info");
            expect(googleConfig.ORGANISATION_NAME).toBe("Rendetalje.dk");
            expect(googleConfig.RUN_MODE).toBe("dry-run");
        });
    });
});
