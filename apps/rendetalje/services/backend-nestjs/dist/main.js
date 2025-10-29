"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const Sentry = require("@sentry/node");
const profiling_node_1 = require("@sentry/profiling-node");
const compression = require("compression");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
const sentry_interceptor_1 = require("./common/sentry/sentry.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const sentryDsn = configService.get("sentry.dsn");
    const sentryEnv = configService.get("sentry.environment") || "development";
    if (sentryDsn) {
        Sentry.init({
            dsn: sentryDsn,
            environment: sentryEnv,
            tracesSampleRate: sentryEnv === "production" ? 0.1 : 1.0,
            profilesSampleRate: sentryEnv === "production" ? 0.1 : 1.0,
            integrations: [(0, profiling_node_1.nodeProfilingIntegration)(), Sentry.httpIntegration()],
            beforeSend(event, hint) {
                const error = hint.originalException;
                if (error && typeof error === "object") {
                    if (error.message?.includes("connection timeout"))
                        return null;
                    if (error.message?.includes("Too Many Requests"))
                        return null;
                    if (error.name === "ValidationError")
                        return null;
                }
                return event;
            },
        });
        console.log("✅ Sentry initialized:", { environment: sentryEnv });
    }
    else {
        console.warn("⚠️  Sentry DSN not configured. Error tracking disabled.");
    }
    app.useGlobalInterceptors(new sentry_interceptor_1.SentryInterceptor());
    app.use((0, helmet_1.default)());
    app.use(compression());
    app.enableCors({
        origin: [
            "http://localhost:3000",
            "https://rendetaljeos.onrender.com",
            configService.get("FRONTEND_URL"),
        ].filter(Boolean),
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.setGlobalPrefix("api/v1");
    if (configService.get("ENABLE_SWAGGER") === "true") {
        const config = new swagger_1.DocumentBuilder()
            .setTitle("RendetaljeOS API")
            .setDescription("Complete Operations Management System API")
            .setVersion("1.0")
            .addBearerAuth()
            .addTag("auth", "Authentication endpoints")
            .addTag("jobs", "Job management endpoints")
            .addTag("customers", "Customer management endpoints")
            .addTag("team", "Team management endpoints")
            .addTag("billing", "Billing and invoicing endpoints")
            .addTag("ai-friday", "AI Friday integration endpoints")
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup("docs", app, document, {
            customSiteTitle: "RendetaljeOS API Documentation",
            customfavIcon: "/favicon.ico",
            customCss: ".swagger-ui .topbar { display: none }",
        });
    }
    app.use("/health", (req, res) => {
        const health = {
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: configService.get("NODE_ENV"),
            version: "1.0.0",
            services: {
                sentry: sentryDsn ? "configured" : "disabled",
                database: configService.get("database.url") ? "configured" : "missing",
                supabase: configService.get("supabase.url") ? "configured" : "missing",
            },
        };
        res.status(200).json(health);
    });
    if (configService.get("NODE_ENV") === "development") {
        app.use("/test-sentry", (req, res) => {
            try {
                Sentry.captureException(new Error("Test Sentry error - please ignore"));
                res.json({
                    message: "Sentry test error sent!",
                    instructions: "Check Sentry dashboard in a few seconds",
                });
            }
            catch (error) {
                res.status(500).json({ error: "Failed to send test error" });
            }
        });
    }
    const port = configService.get("PORT") || 3001;
    await app.listen(port, "0.0.0.0");
    console.log(`🚀 RendetaljeOS API running on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/docs`);
    console.log(`❤️  Health Check: http://localhost:${port}/health`);
    if (configService.get("NODE_ENV") === "development") {
        console.log(`🧪 Test Sentry: http://localhost:${port}/test-sentry`);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map