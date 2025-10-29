import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import * as compression from "compression";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { SentryInterceptor } from "./common/sentry/sentry.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Initialize Sentry FIRST (before any requests)
  const sentryDsn = configService.get("sentry.dsn");
  const sentryEnv = configService.get("sentry.environment") || "development";

  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: sentryEnv,
      tracesSampleRate: sentryEnv === "production" ? 0.1 : 1.0,
      profilesSampleRate: sentryEnv === "production" ? 0.1 : 1.0,
      integrations: [nodeProfilingIntegration(), Sentry.httpIntegration()],
      beforeSend(event, hint) {
        // Filter out non-critical errors
        const error = hint.originalException as any;
        if (error && typeof error === "object") {
          if (error.message?.includes("connection timeout")) return null;
          if (error.message?.includes("Too Many Requests")) return null;
          if (error.name === "ValidationError") return null;
        }
        return event;
      },
    });
    console.log("✅ Sentry initialized:", { environment: sentryEnv });
  } else {
    console.warn("⚠️  Sentry DSN not configured. Error tracking disabled.");
  }

  // Global Sentry interceptor
  app.useGlobalInterceptors(new SentryInterceptor());

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "https://rendetaljeos.onrender.com",
      configService.get("FRONTEND_URL"),
    ].filter(Boolean),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // API prefix
  app.setGlobalPrefix("api/v1");

  // Swagger documentation
  if (configService.get("ENABLE_SWAGGER") === "true") {
    const config = new DocumentBuilder()
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

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document, {
      customSiteTitle: "RendetaljeOS API Documentation",
      customfavIcon: "/favicon.ico",
      customCss: ".swagger-ui .topbar { display: none }",
    });
  }

  // Enhanced health check
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

  // Test Sentry endpoint (only in development)
  if (configService.get("NODE_ENV") === "development") {
    app.use("/test-sentry", (req, res) => {
      try {
        Sentry.captureException(new Error("Test Sentry error - please ignore"));
        res.json({
          message: "Sentry test error sent!",
          instructions: "Check Sentry dashboard in a few seconds",
        });
      } catch (error) {
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
