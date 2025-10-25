"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeModule = void 0;
const common_1 = require("@nestjs/common");
const realtime_gateway_1 = require("./realtime.gateway");
const realtime_controller_1 = require("./realtime.controller");
const notification_service_1 = require("./notification.service");
const database_module_1 = require("../database/database.module");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let RealtimeModule = class RealtimeModule {
};
exports.RealtimeModule = RealtimeModule;
exports.RealtimeModule = RealtimeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: {
                        expiresIn: configService.get('JWT_EXPIRATION') || '7d',
                    },
                }),
            }),
        ],
        controllers: [realtime_controller_1.RealtimeController],
        providers: [realtime_gateway_1.RealtimeGateway, notification_service_1.NotificationService],
        exports: [realtime_gateway_1.RealtimeGateway, notification_service_1.NotificationService],
    })
], RealtimeModule);
//# sourceMappingURL=realtime.module.js.map