import { LoggerService } from '@nestjs/common';
interface LogMetadata {
    [key: string]: any;
}
export declare class CustomLoggerService implements LoggerService {
    private logger;
    private supabase;
    private context?;
    constructor(context?: string);
    setContext(context: string): void;
    log(message: any, context?: string): void;
    error(message: any, trace?: string, context?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
    verbose(message: any, context?: string): void;
    private writeLog;
    logWithUser(level: string, message: string, userId: string, metadata?: LogMetadata): Promise<void>;
}
export {};
