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
const auth_module_1 = require("./modules/auth/auth.module");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const customers_module_1 = require("./modules/customers/customers.module");
const team_module_1 = require("./modules/team/team.module");
const billing_module_1 = require("./modules/billing/billing.module");
const ai_friday_module_1 = require("./modules/ai-friday/ai-friday.module");
const integrations_module_1 = require("./modules/integrations/integrations.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const supabase_module_1 = require("./modules/supabase/supabase.module");
const logger_module_1 = require("./common/logger/logger.module");
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
            logger_module_1.LoggerModule,
            supabase_module_1.SupabaseModule,
            auth_module_1.AuthModule,
            jobs_module_1.JobsModule,
            customers_module_1.CustomersModule,
            team_module_1.TeamModule,
            billing_module_1.BillingModule,
            ai_friday_module_1.AiFridayModule,
            integrations_module_1.IntegrationsModule,
            notifications_module_1.NotificationsModule,
            analytics_module_1.AnalyticsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map