import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, json, printf, errors, colorize } = winston.format;

/**
 * Custom format to mask sensitive information in logs
 * Prevents leaking credentials, JWT tokens, API keys, etc.
 */
const maskSensitive = winston.format((info) => {
  if (info.message && typeof info.message === "string") {
    // Mask common sensitive patterns
    info.message = info.message
      .replace(
        /(jwt|token|password|secret|apikey|api_key|bearer)\s*[=:]\s*\S+/gi,
        "$1=***MASKED***"
      )
      .replace(/(authorization:\s*bearer\s+)\S+/gi, "$1***MASKED***")
      .replace(
        /([?&])(jwt|token|password|secret|apikey|api_key)=([^&\s]+)/gi,
        "$1$2=***MASKED***"
      );
  }

  // Mask sensitive fields in metadata
  if (info.meta && typeof info.meta === "object") {
    const sensitiveFields = [
      "password",
      "token",
      "jwt",
      "secret",
      "apiKey",
      "api_key",
      "authorization",
    ];
    const metaObj = info.meta as Record<string, any>;
    for (const field of sensitiveFields) {
      if (field in metaObj) {
        metaObj[field] = "***MASKED***";
      }
    }
  }

  return info;
});

/**
 * Development-friendly console format with colors
 */
const devFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  maskSensitive(),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr =
      Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : "";
    const stackStr = stack ? `\n${stack}` : "";
    return `${timestamp} [${level}]: ${message}${metaStr}${stackStr}`;
  })
);

/**
 * Production JSON format for structured logging
 */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  maskSensitive(),
  json()
);

/**
 * Determine log level based on environment
 */
const getLogLevel = (): string => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
};

/**
 * Determine log format based on environment
 */
const getLogFormat = () => {
  return process.env.NODE_ENV === "production" ? prodFormat : devFormat;
};

/**
 * Create transports based on environment
 */
const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [
    // Always log to console
    new winston.transports.Console(),
  ];

  // In production, also log to rotating files
  if (process.env.NODE_ENV === "production") {
    transports.push(
      new DailyRotateFile({
        filename: "logs/app-%DATE%.log",
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "14d",
        level: "info",
      }),
      new DailyRotateFile({
        filename: "logs/error-%DATE%.log",
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "30d",
        level: "error",
      })
    );
  } else {
    // In development, log all to a simple file
    transports.push(
      new winston.transports.File({
        filename: "logs/dev.log",
        maxsize: 5242880, // 5MB
        maxFiles: 2,
      })
    );
  }

  return transports;
};

/**
 * Central logger instance
 * Usage:
 *   logger.info('User logged in', { userId: 123 });
 *   logger.error('Database connection failed', { error: err });
 *   logger.debug('Processing request', { requestId: 'abc123' });
 */
export const logger = winston.createLogger({
  level: getLogLevel(),
  format: getLogFormat(),
  transports: getTransports(),
  exitOnError: false,
});

/**
 * Create a child logger with additional default metadata
 * Useful for service-specific or module-specific logging
 *
 * @param defaultMeta - Default metadata to include in all logs
 * @returns Child logger instance
 *
 * @example
 * const serviceLogger = createChildLogger({ service: 'auth-service' });
 * serviceLogger.info('User authenticated'); // Will include { service: 'auth-service' }
 */
export const createChildLogger = (defaultMeta: Record<string, any>) => {
  return logger.child(defaultMeta);
};

/**
 * Express middleware for HTTP request logging
 * Logs incoming requests with method, URL, status code, and response time
 *
 * @example
 * app.use(httpLogger);
 */
export const httpLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info("HTTP Request", {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });
  });

  next();
};

export default logger;
