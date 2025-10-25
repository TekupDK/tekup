"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const integration_service_1 = require("./integration.service");
const tekup_billy_service_1 = require("./tekup-billy/tekup-billy.service");
const tekup_vault_service_1 = require("./tekup-vault/tekup-vault.service");
const renos_calendar_service_1 = require("./renos-calendar/renos-calendar.service");
const integrations_controller_1 = require("./integrations.controller");
let IntegrationsModule = class IntegrationsModule {
};
exports.IntegrationsModule = IntegrationsModule;
exports.IntegrationsModule = IntegrationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule.register({
                timeout: 30000,
                maxRedirects: 5,
            }),
            config_1.ConfigModule,
        ],
        controllers: [integrations_controller_1.IntegrationsController],
        providers: [
            integration_service_1.IntegrationService,
            tekup_billy_service_1.TekupBillyService,
            tekup_vault_service_1.TekupVaultService,
            renos_calendar_service_1.RenosCalendarService,
        ],
        exports: [
            integration_service_1.IntegrationService,
            tekup_billy_service_1.TekupBillyService,
            tekup_vault_service_1.TekupVaultService,
            renos_calendar_service_1.RenosCalendarService,
        ],
    })
], IntegrationsModule);
//# sourceMappingURL=integrations.module.js.map