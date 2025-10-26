import pino, { Logger, LoggerOptions } from 'pino';

export interface CreateLoggerOptions extends LoggerOptions {
  serviceName?: string;
  environment?: string;
  pretty?: boolean;
}

let rootLogger: Logger | null = null;

export function createLogger(opts: CreateLoggerOptions = {}): Logger {
  if (rootLogger) return rootLogger;
  const {
    serviceName = process.env.SERVICE_NAME || 'unknown-service',
    environment = process.env.NODE_ENV || 'development',
    pretty = environment === 'development',
    ...rest
  } = opts;

  const transport = pretty
    ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
    : undefined;

  rootLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: serviceName, env: environment },
    transport,
    ...rest
  });
  return rootLogger;
}

export function getLogger(): Logger {
  if (!rootLogger) {
    return createLogger();
  }
  return rootLogger;
}
