import path from "path";
import pino from "pino";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDevelopment = process.env.NODE_ENV !== "production";

// Determine log file path
const logDir = path.join(__dirname, "../../logs");
const logFile = path.join(
  logDir,
  isDevelopment ? "dev-server.log" : "prod-server.log"
);

export const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: undefined, // omit pid, hostname to keep logs cleaner
  transport: {
    targets: [
      // Console output with pretty formatting in development
      {
        target: "pino-pretty",
        level: isDevelopment ? "debug" : "info",
        options: {
          destination: 1, // stdout
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
          singleLine: false,
        },
      },
      // File output (always JSON format for parsing)
      {
        target: "pino/file",
        level: isDevelopment ? "debug" : "info",
        options: {
          destination: logFile,
          mkdir: true,
        },
      },
    ],
  },
});
