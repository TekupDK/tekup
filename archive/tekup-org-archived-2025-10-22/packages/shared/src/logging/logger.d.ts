export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export interface LogContext {
    [key: string]: any;
}
export interface Logger {
    error(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
}
export declare function createLogger(service: string, minLevel?: LogLevel): Logger;
//# sourceMappingURL=logger.d.ts.map