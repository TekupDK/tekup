"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiFridayModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const database_module_1 = require("../database/database.module");
const ai_friday_service_1 = require("./ai-friday.service");
const ai_friday_controller_1 = require("./ai-friday.controller");
const chat_sessions_service_1 = require("./chat-sessions.service");
const leads_module_1 = require("../leads/leads.module");
const customers_module_1 = require("../customers/customers.module");
const team_module_1 = require("../team/team.module");
let AiFridayModule = class AiFridayModule {
};
exports.AiFridayModule = AiFridayModule;
exports.AiFridayModule = AiFridayModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule.register({
                timeout: 60000,
                maxRedirects: 5,
            }),
            config_1.ConfigModule,
            database_module_1.DatabaseModule,
            leads_module_1.LeadsModule,
            customers_module_1.CustomersModule,
            team_module_1.TeamModule,
        ],
        controllers: [ai_friday_controller_1.AiFridayController],
        providers: [ai_friday_service_1.AiFridayService, chat_sessions_service_1.ChatSessionsService],
        exports: [ai_friday_service_1.AiFridayService, chat_sessions_service_1.ChatSessionsService],
    })
], AiFridayModule);
//# sourceMappingURL=ai-friday.module.js.map