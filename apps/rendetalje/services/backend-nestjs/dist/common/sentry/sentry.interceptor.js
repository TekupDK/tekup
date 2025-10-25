"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentryInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const Sentry = require("@sentry/node");
let SentryInterceptor = class SentryInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.catchError)((error) => {
            if (!(error instanceof common_1.HttpException)) {
                const request = context.switchToHttp().getRequest();
                Sentry.withScope((scope) => {
                    scope.setContext('request', {
                        method: request.method,
                        url: request.url,
                        headers: this.sanitizeHeaders(request.headers),
                        body: this.sanitizeBody(request.body),
                    });
                    scope.setUser({
                        id: request.user?.id,
                        email: request.user?.email,
                    });
                    Sentry.captureException(error);
                });
            }
            return (0, rxjs_1.throwError)(() => error);
        }));
    }
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        delete sanitized.authorization;
        delete sanitized.cookie;
        return sanitized;
    }
    sanitizeBody(body) {
        if (!body)
            return body;
        const sanitized = { ...body };
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.apiKey;
        return sanitized;
    }
};
exports.SentryInterceptor = SentryInterceptor;
exports.SentryInterceptor = SentryInterceptor = __decorate([
    (0, common_1.Injectable)()
], SentryInterceptor);
//# sourceMappingURL=sentry.interceptor.js.map