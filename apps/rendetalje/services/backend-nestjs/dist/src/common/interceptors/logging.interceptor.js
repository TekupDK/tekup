"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = LoggingInterceptor_1 = class LoggingInterceptor {
    constructor() {
        this.logger = new common_1.Logger(LoggingInterceptor_1.name);
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const { method, url, body, query, params } = request;
        const userAgent = request.get('User-Agent') || '';
        const ip = request.ip;
        const now = Date.now();
        this.logger.log(`Incoming Request: ${method} ${url} - ${ip} - ${userAgent}`);
        if (Object.keys(body || {}).length > 0) {
            const sanitizedBody = this.sanitizeBody(body);
            this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
        }
        if (Object.keys(query || {}).length > 0) {
            this.logger.debug(`Query Params: ${JSON.stringify(query)}`);
        }
        if (Object.keys(params || {}).length > 0) {
            this.logger.debug(`Route Params: ${JSON.stringify(params)}`);
        }
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                const responseTime = Date.now() - now;
                this.logger.log(`Outgoing Response: ${method} ${url} - ${response.statusCode} - ${responseTime}ms`);
            },
            error: (error) => {
                const responseTime = Date.now() - now;
                this.logger.error(`Error Response: ${method} ${url} - ${error.status || 500} - ${responseTime}ms`, error.stack);
            },
        }));
    }
    sanitizeBody(body) {
        if (!body || typeof body !== 'object') {
            return body;
        }
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
        const sanitized = { ...body };
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        return sanitized;
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = LoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map