/**
 * Simple logger utility for Friday AI Chat
 * Replaces console.log with environment-aware logging
 */

type LogLevel = "debug" | "info" | "warn" | "error";

function shouldLog(level: LogLevel): boolean {
  const env = process.env.NODE_ENV;
  const debugEnabled = process.env.DEBUG === "true";

  // In production, only log warnings and errors
  if (env === "production" && level === "debug") {
    return false;
  }

  // Debug logs only if DEBUG=true
  if (level === "debug" && !debugEnabled) {
    return false;
  }

  return true;
}

function formatMessage(
  level: LogLevel,
  message: string,
  ...args: any[]
): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return `${prefix} ${message}`;
}

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (shouldLog("debug")) {
      console.log(formatMessage("debug", message), ...args);
    }
  },

  info: (message: string, ...args: any[]) => {
    if (shouldLog("info")) {
      console.log(formatMessage("info", message), ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (shouldLog("warn")) {
      console.warn(formatMessage("warn", message), ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    if (shouldLog("error")) {
      console.error(formatMessage("error", message), ...args);
    }
  },
};
