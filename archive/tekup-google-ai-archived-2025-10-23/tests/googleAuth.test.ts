import { afterEach, describe, expect, it, vi } from "vitest";

const baseGoogleConfig = {
    GOOGLE_PROJECT_ID: "renos-test",
    GOOGLE_CLIENT_EMAIL: undefined as string | undefined,
    GOOGLE_PRIVATE_KEY: undefined as string | undefined,
    GOOGLE_IMPERSONATED_USER: undefined as string | undefined,
    DEFAULT_EMAIL_FROM: undefined as string | undefined,
    ORGANISATION_NAME: "Rendetalje.dk",
    RUN_MODE: "dry-run" as const,
};

const baseServerConfig = {
    PORT: 3000,
    LOG_LEVEL: "info",
};

type ConfigOverrides = {
    googleConfig?: Partial<typeof baseGoogleConfig>;
    serverConfig?: Partial<typeof baseServerConfig>;
    isLiveMode?: boolean;
};

async function importAuth(overrides: ConfigOverrides = {}) {
    vi.resetModules();
    vi.doMock("../src/config", () => ({
        googleConfig: { ...baseGoogleConfig, ...(overrides.googleConfig ?? {}) },
        serverConfig: { ...baseServerConfig, ...(overrides.serverConfig ?? {}) },
        isLiveMode: overrides.isLiveMode ?? false,
    }));

    const module = await import("../src/services/googleAuth");
    return module;
}

afterEach(() => {
    vi.resetModules();
    vi.unmock("../src/config");
    vi.restoreAllMocks();
});

describe("getGoogleAuthClient", () => {
    it("returns null when service account credentials are missing", async () => {
        const { getGoogleAuthClient } = await importAuth({
            googleConfig: {
                GOOGLE_CLIENT_EMAIL: undefined,
                GOOGLE_PRIVATE_KEY: undefined,
            },
        });

        const client = getGoogleAuthClient(["scope"]);

        expect(client).toBeNull();
    });

    it("uses impersonated user when provided", async () => {
        const { getGoogleAuthClient } = await importAuth({
            googleConfig: {
                GOOGLE_CLIENT_EMAIL: "service@project.iam.gserviceaccount.com",
                GOOGLE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nFAKE\n-----END PRIVATE KEY-----\n",
                GOOGLE_IMPERSONATED_USER: "info@rendetalje.dk",
            },
        });

        const client = getGoogleAuthClient(["scope"]);

        expect(client).not.toBeNull();
        expect(client?.subject).toBe("info@rendetalje.dk");
    });
});
