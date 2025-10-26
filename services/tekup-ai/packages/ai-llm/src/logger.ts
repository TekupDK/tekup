/**
 * Simple logger for @tekup-ai/llm package
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  log(level: LogLevel, messageOrContext: string | object, message?: string): void {
    const timestamp = new Date().toISOString();
    if (typeof messageOrContext === 'string') {
      console[level === 'debug' ? 'log' : level](`[${timestamp}] [${level.toUpperCase()}]`, messageOrContext);
    } else {
      console[level === 'debug' ? 'log' : level](`[${timestamp}] [${level.toUpperCase()}]`, message, messageOrContext);
    }
  }

  debug(messageOrContext: string | object, message?: string): void {
    this.log('debug', messageOrContext, message);
  }

  info(messageOrContext: string | object, message?: string): void {
    this.log('info', messageOrContext, message);
  }

  warn(messageOrContext: string | object, message?: string): void {
    this.log('warn', messageOrContext, message);
  }

  error(messageOrContext: string | object, message?: string): void {
    this.log('error', messageOrContext, message);
  }
}

export const logger = new Logger();
