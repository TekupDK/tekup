import { createServer as createHttpServer } from "http";
import type { RequestListener, Server } from "http";
import { execSync } from "child_process";
import { serverConfig } from "./config";
import { logger } from "./logger";
import { createServer as createExpressServer } from "./server";
import { validateProductionRequirements } from "./env";
import { testDatabaseConnection } from "./services/databaseService";

async function initializeDatabase(): Promise<void> {
    try {
        logger.info("Initializing database schema...");
        // Push database schema to ensure tables exist
        await new Promise<void>((resolve, reject) => {
            try {
                execSync("npx prisma db push --accept-data-loss", { stdio: "pipe" });
                resolve();
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });
        logger.info("Database schema initialized successfully");

        // Test database connection
        logger.info("Testing database connection...");
        const isConnected = await testDatabaseConnection();
        if (!isConnected) {
            throw new Error("Database connection test failed");
        }
        logger.info("Database connection verified");
    } catch (error) {
        logger.warn({ err: error }, "Database initialization failed, continuing anyway");
        // Don't fail the startup if schema push fails (might already exist)
    }
}

async function bootstrap(): Promise<void> {
    // Validate environment configuration
    validateProductionRequirements();

    // Initialize database schema before starting server
    await initializeDatabase();

    const app = createExpressServer();
    const port = serverConfig.PORT ?? 3000;

    const listener: RequestListener = (req, res) => {
        app(req, res);
    };
    const server: Server = createHttpServer(listener);

    // Graceful shutdown handler
    const gracefulShutdown = (signal: string) => {
        logger.info({ signal }, "Received shutdown signal, closing server gracefully");

        server.close(() => {
            logger.info("Server closed successfully");
            process.exit(0);
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
            logger.error("Forced shutdown after timeout");
            process.exit(1);
        }, 30000);
    };

    // Register signal handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    await new Promise<void>((resolve, reject) => {
        server.listen(port, () => {
            logger.info({ port }, "Assistant service is listening");
            resolve();
        });

        server.on("error", (error) => {
            logger.error({ err: error }, "HTTP server failed to start");
            reject(error);
        });
    });
}

bootstrap().catch((error) => {
    logger.error({ err: error }, "Failed to start assistant service");
    process.exitCode = 1;
});
