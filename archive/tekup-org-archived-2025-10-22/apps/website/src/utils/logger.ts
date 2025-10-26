// Local logger utility for website app
// Temporary solution for @tekup/shared import issues

/**
 *
 * @param context
 */
export function createLogger(context: string) {
  return {
    info: (...args: any[]) => {
      console.log(`[${context}] [INFO]`, ...args);
    },
    error: (...args: any[]) => {
      console.error(`[${context}] [ERROR]`, ...args);
    },
    warn: (...args: any[]) => {
      console.warn(`[${context}] [WARN]`, ...args);
    },
    debug: (...args: any[]) => {
      console.debug(`[${context}] [DEBUG]`, ...args);
    }
  };
}