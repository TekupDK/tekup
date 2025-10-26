class ConsoleLogger {
    service;
    minLevel;
    constructor(service, minLevel = 'info') {
        this.service = service;
        this.minLevel = minLevel;
    }
    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.minLevel);
    }
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] [${this.service}] ${message}${contextStr}`;
    }
    error(message, context) {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, context));
        }
    }
    warn(message, context) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, context));
        }
    }
    info(message, context) {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', message, context));
        }
    }
    debug(message, context) {
        if (this.shouldLog('debug')) {
            console.debug(this.formatMessage('debug', message, context));
        }
    }
}
export function createLogger(service, minLevel) {
    const level = minLevel || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');
    return new ConsoleLogger(service, level);
}
//# sourceMappingURL=logger.js.map