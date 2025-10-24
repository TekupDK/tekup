"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeTrackingModule = void 0;
const common_1 = require("@nestjs/common");
const time_tracking_service_1 = require("./time-tracking.service");
const time_tracking_controller_1 = require("./time-tracking.controller");
const supabase_module_1 = require("../supabase/supabase.module");
let TimeTrackingModule = class TimeTrackingModule {
};
exports.TimeTrackingModule = TimeTrackingModule;
exports.TimeTrackingModule = TimeTrackingModule = __decorate([
    (0, common_1.Module)({
        imports: [supabase_module_1.SupabaseModule],
        controllers: [time_tracking_controller_1.TimeTrackingController, time_tracking_controller_1.TimeCorrectionsController],
        providers: [time_tracking_service_1.TimeTrackingService],
        exports: [time_tracking_service_1.TimeTrackingService],
    })
], TimeTrackingModule);
//# sourceMappingURL=time-tracking.module.js.map