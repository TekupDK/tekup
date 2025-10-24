declare const _default: () => {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    database: {
        url: string;
    };
    supabase: {
        url: string;
        anonKey: string;
        serviceRoleKey: string;
    };
    auth: {
        jwtSecret: string;
        jwtExpiresIn: string;
        encryptionKey: string;
    };
    integrations: {
        tekupBilly: {
            url: string;
            apiKey: string;
        };
        tekupVault: {
            url: string;
            apiKey: string;
        };
        aiFriday: {
            url: string;
            apiKey: string;
        };
        renosCalendar: {
            url: string;
            apiKey: string;
        };
    };
    email: {
        host: string;
        port: number;
        user: string;
        pass: string;
        from: string;
    };
    redis: {
        url: string;
        password: string;
    };
    google: {
        mapsApiKey: string;
        calendarClientId: string;
        calendarClientSecret: string;
    };
    sentry: {
        dsn: string;
        environment: string;
    };
    storage: {
        bucket: string;
        maxFileSize: number;
        allowedTypes: string[];
    };
    business: {
        currency: string;
        timezone: string;
        language: string;
        rates: {
            standard: number;
            deep: number;
            window: number;
            moveout: number;
        };
    };
    features: {
        aiFriday: boolean;
        mobileApp: boolean;
        voiceInput: boolean;
        offlineMode: boolean;
        realTimeTracking: boolean;
        automaticInvoicing: boolean;
    };
    security: {
        rateLimitWindowMs: number;
        rateLimitMaxRequests: number;
        bcryptSaltRounds: number;
        sessionTimeoutHours: number;
    };
    performance: {
        databasePoolSize: number;
        cacheTtlSeconds: number;
        maxConcurrentJobs: number;
        imageCompressionQuality: number;
    };
};
export default _default;
