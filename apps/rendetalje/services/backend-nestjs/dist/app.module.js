"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const customers_module_1 = require("./customers/customers.module");
const leads_module_1 = require("./leads/leads.module");
const auth_module_1 = require("./auth/auth.module");
const team_module_1 = require("./team/team.module");
const time_tracking_module_1 = require("./time-tracking/time-tracking.module");
const gdpr_module_1 = require("./gdpr/gdpr.module");
const quality_module_1 = require("./quality/quality.module");
const realtime_module_1 = require("./realtime/realtime.module");
const database_module_1 = require("./database/database.module");
const health_module_1 = require("./health/health.module");
const configuration_1 = require("./config/configuration");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                envFilePath: ['.env.local', '.env'],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            database_module_1.DatabaseModule,
            health_module_1.HealthModule,
            customers_module_1.CustomersModule,
            leads_module_1.LeadsModule,
            auth_module_1.AuthModule,
            team_module_1.TeamModule,
            time_tracking_module_1.TimeTrackingModule,
            gdpr_module_1.GdprModule,
            quality_module_1.QualityModule,
            realtime_module_1.RealtimeModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map