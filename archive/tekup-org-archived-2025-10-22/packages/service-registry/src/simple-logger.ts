// Simple logger implementation for service registry
export interface Logger {
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

class SimpleLogger implements Logger {
  constructor(private readonly service: string) {}

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${this.service}] ${message}`;
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('error', message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('warn', message), ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(this.formatMessage('info', message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    console.debug(this.formatMessage('debug', message), ...args);
  }
}

export function createLogger(service: string): Logger {
  return new SimpleLogger(service);
}