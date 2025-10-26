import { google } from "googleapis";
import { JWT } from "google-auth-library";
import { googleConfig, isLiveMode } from "../config";
import { logger } from "../logger";

// Cache auth clients by scope combination
const authClientCache = new Map<string, JWT>();

export function getGoogleAuthClient(scopes: string[]): JWT | null {
    if (!googleConfig.GOOGLE_CLIENT_EMAIL || !googleConfig.GOOGLE_PRIVATE_KEY) {
        logger.warn(
            {
                hasClientEmail: Boolean(googleConfig.GOOGLE_CLIENT_EMAIL),
                hasPrivateKey: Boolean(googleConfig.GOOGLE_PRIVATE_KEY),
            },
            "Google credentials are missing; Google integrations will run in dry-run mode"
        );
        return null;
    }

    const subject = googleConfig.GOOGLE_IMPERSONATED_USER ?? googleConfig.GOOGLE_CLIENT_EMAIL;

    // Create a cache key based on scopes and subject
    const cacheKey = `${scopes.sort().join(",")}:${subject}`;

    // Return cached client if it exists
    if (authClientCache.has(cacheKey)) {
        return authClientCache.get(cacheKey);
    }

    const privateKey = googleConfig.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

    const authClient = new google.auth.JWT({
        email: googleConfig.GOOGLE_CLIENT_EMAIL,
        key: privateKey,
        scopes,
        subject,
        // Add additional options to handle OpenSSL compatibility
        additionalClaims: {},
    });

    // Cache the new client
    authClientCache.set(cacheKey, authClient);

    if (!isLiveMode) {
        logger.info(
            {
                impersonatedUser: googleConfig.GOOGLE_IMPERSONATED_USER ?? null,
            },
            "Google auth client initialised in dry-run mode"
        );
    } else if (googleConfig.GOOGLE_IMPERSONATED_USER) {
        logger.info({ impersonatedUser: googleConfig.GOOGLE_IMPERSONATED_USER }, "Google auth client impersonating workspace user");
    }

    return authClient;
}
