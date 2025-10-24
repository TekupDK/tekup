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
exports.CustomLoggerService = void 0;
const common_1 = require("@nestjs/common");
const winston = require("winston");
const supabase_js_1 = require("@supabase/supabase-js");
let CustomLoggerService = class CustomLoggerService {
    constructor(context) {
        this.supabase = null;
        this.context = context;
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            this.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        }
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
            defaultMeta: { service: 'backend-nestjs' },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(winston.format.colorize(), winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                        const ctx = context ? `[${context}]` : '';
                        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                        return `${timestamp} ${level} ${ctx} ${message} ${metaStr}`;
                    })),
                }),
            ],
        });
    }
    setContext(context) {
        this.context = context;
    }
    log(message, context) {
        this.writeLog('info', message, context);
    }
    error(message, trace, context) {
        this.writeLog('error', message, context, { trace });
    }
    warn(message, context) {
        this.writeLog('warn', message, context);
    }
    debug(message, context) {
        this.writeLog('debug', message, context);
    }
    verbose(message, context) {
        this.writeLog('verbose', message, context);
    }
    async writeLog(level, message, context, metadata) {
        const contextToUse = context || this.context;
        const logData = {
            level,
            message: typeof message === 'object' ? JSON.stringify(message) : message,
            context: contextToUse,
            ...metadata,
        };
        this.logger.log(level, logData);
        if (this.supabase && process.env.NODE_ENV === 'production') {
            try {
                await this.supabase.from('application_logs').insert({
                    level,
                    message: logData.message,
                    service: 'backend-nestjs',
                    metadata: metadata || {},
                    context: contextToUse,
                });
            }
            catch (error) {
                this.logger.error('Failed to write log to Supabase', { error });
            }
        }
    }
    async logWithUser(level, message, userId, metadata) {
        if (this.supabase && process.env.NODE_ENV === 'production') {
            try {
                await this.supabase.from('application_logs').insert({
                    level,
                    message,
                    service: 'backend-nestjs',
                    user_id: userId,
                    metadata: metadata || {},
                });
            }
            catch (error) {
                this.logger.error('Failed to write user log to Supabase', { error });
            }
        }
        this.logger.log(level, { message, userId, ...metadata });
    }
};
exports.CustomLoggerService = CustomLoggerService;
exports.CustomLoggerService = CustomLoggerService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT }),
    __metadata("design:paramtypes", [String])
], CustomLoggerService);
//# sourceMappingURL=custom-logger.service.js.map