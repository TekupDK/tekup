"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityModule = void 0;
const common_1 = require("@nestjs/common");
const quality_service_1 = require("./quality.service");
const quality_controller_1 = require("./quality.controller");
const quality_checklists_service_1 = require("./quality-checklists.service");
const photo_documentation_service_1 = require("./photo-documentation.service");
const supabase_module_1 = require("../supabase/supabase.module");
const jobs_module_1 = require("../jobs/jobs.module");
let QualityModule = class QualityModule {
};
exports.QualityModule = QualityModule;
exports.QualityModule = QualityModule = __decorate([
    (0, common_1.Module)({
        imports: [supabase_module_1.SupabaseModule, jobs_module_1.JobsModule],
        controllers: [quality_controller_1.QualityController],
        providers: [quality_service_1.QualityService, quality_checklists_service_1.QualityChecklistsService, photo_documentation_service_1.PhotoDocumentationService],
        exports: [quality_service_1.QualityService, quality_checklists_service_1.QualityChecklistsService, photo_documentation_service_1.PhotoDocumentationService],
    })
], QualityModule);
//# sourceMappingURL=quality.module.js.map