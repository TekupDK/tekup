"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = exports.RateLimit = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const RATE_LIMIT_KEY = 'rateLimit';
const requestCounts = new Map();
const RateLimit = (config) => {
    return (target, propertyKey, descriptor) => {
        if (descriptor) {
            Reflect.defineMetadata(RATE_LIMIT_KEY, config, descriptor.value);
        }
        else {
            Reflect.defineMetadata(RATE_LIMIT_KEY, config, target);
        }
    };
};
exports.RateLimit = RateLimit;
let RateLimitGuard = class RateLimitGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const rateLimitConfig = this.reflector.get(RATE_LIMIT_KEY, context.getHandler()) || this.reflector.get(RATE_LIMIT_KEY, context.getClass());
        if (!rateLimitConfig) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const key = this.getKey(request);
        const now = Date.now();
        const record = requestCounts.get(key);
        if (!record || now > record.resetTime) {
            requestCounts.set(key, {
                count: 1,
                resetTime: now + rateLimitConfig.windowMs,
            });
            return true;
        }
        if (record.count >= rateLimitConfig.maxRequests) {
            const message = rateLimitConfig.message || 'Too many requests';
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message,
                error: 'Too Many Requests',
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        record.count++;
        return true;
    }
    getKey(request) {
        const ip = request.ip || request.connection.remoteAddress || 'unknown';
        const userId = request.user?.id || 'anonymous';
        return `${ip}:${userId}`;
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map