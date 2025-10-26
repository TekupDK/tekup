import pino from "pino";
import { serverConfig } from "./config";

export const logger = pino({
    level: serverConfig.LOG_LEVEL,
    transport:
        process.env.NODE_ENV === "development"
            ? {
                target: "pino-pretty",
                options: {
                    translateTime: "SYS:standard",
                    colorize: true,
                },
            }
            : undefined,
});
