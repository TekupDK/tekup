"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossAppWorkflowEngine = exports.BACKUP_WORKFLOW = exports.COMPLIANCE_CHECK_WORKFLOW = exports.LEAD_CREATION_WORKFLOW = void 0;
// Domain exports
__exportStar(require("./voice"), exports);
__exportStar(require("./lead"), exports);
__exportStar(require("./runtime/env"), exports);
// Event system for cross-app communication
__exportStar(require("./events/event.types"), exports);
__exportStar(require("./events/websocket-event-bus"), exports);
// Workflow system for cross-app automation
var workflow_types_1 = require("./workflows/workflow.types");
Object.defineProperty(exports, "LEAD_CREATION_WORKFLOW", { enumerable: true, get: function () { return workflow_types_1.LEAD_CREATION_WORKFLOW; } });
Object.defineProperty(exports, "COMPLIANCE_CHECK_WORKFLOW", { enumerable: true, get: function () { return workflow_types_1.COMPLIANCE_CHECK_WORKFLOW; } });
Object.defineProperty(exports, "BACKUP_WORKFLOW", { enumerable: true, get: function () { return workflow_types_1.BACKUP_WORKFLOW; } });
var workflow_engine_1 = require("./workflows/workflow-engine");
Object.defineProperty(exports, "CrossAppWorkflowEngine", { enumerable: true, get: function () { return workflow_engine_1.WorkflowEngine; } });
// Monitoring and performance tracking
__exportStar(require("./monitoring"), exports);
// Logging infrastructure
__exportStar(require("./logging"), exports);
// MCP shared types
__exportStar(require("./mcp"), exports);
// Lead Bridge integration with proven system
// export * from './lead-bridge'; // TODO: Implement lead-bridge module
//# sourceMappingURL=index.js.map