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
exports.createRateLimiters = exports.SecurityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const config_1 = require("@nestjs/config");
let SecurityMiddleware = class SecurityMiddleware {
    constructor(configService) {
        this.configService = configService;
    }
    use(req, res, next) {
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    scriptSrc: ["'self'"],
                    connectSrc: ["'self'", 'wss:', 'ws:'],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                    baseUri: ["'self'"],
                    formAction: ["'self'"],
                },
            },
            crossOriginEmbedderPolicy: false,
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
            noSniff: true,
            frameguard: { action: 'deny' },
            xssFilter: true,
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        })(req, res, () => { });
        const allowedOrigins = this.configService.get('ALLOWED_ORIGINS')?.split(',') || [
            'http://localhost:3000',
            'https://app.rendetalje.dk',
        ];
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
        next();
    }
};
exports.SecurityMiddleware = SecurityMiddleware;
exports.SecurityMiddleware = SecurityMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityMiddleware);
const createRateLimiters = (configService) => {
    const isProduction = configService.get('NODE_ENV') === 'production';
    return {
        general: rateLimit({
            windowMs: 15 * 60 * 1000,
            max: isProduction ? 100 : 1000,
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes',
            },
            standardHeaders: true,
            legacyHeaders: false,
        }),
        auth: rateLimit({
            windowMs: 15 * 60 * 1000,
            max: isProduction ? 5 : 50,
            message: {
                error: 'Too many authentication attempts, please try again later.',
                retryAfter: '15 minutes',
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: true,
        }),
        passwordReset: rateLimit({
            windowMs: 60 * 60 * 1000,
            max: isProduction ? 3 : 10,
            message: {
                error: 'Too many password reset attempts, please try again later.',
                retryAfter: '1 hour',
            },
            standardHeaders: true,
            legacyHeaders: false,
        }),
        upload: rateLimit({
            windowMs: 15 * 60 * 1000,
            max: isProduction ? 20 : 100,
            message: {
                error: 'Too many upload attempts, please try again later.',
                retryAfter: '15 minutes',
            },
            standardHeaders: true,
            legacyHeaders: false,
        }),
    };
};
exports.createRateLimiters = createRateLimiters;
//# sourceMappingURL=security.middleware.js.map