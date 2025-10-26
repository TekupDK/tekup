import { Router, Request, Response } from "express";
import { logger } from "../logger";
import {
    getMicrosoftAgentFrameworkStatus,
    initializeMicrosoftAgentFramework,
    getHybridController,
    getTelemetryService,
    getPluginManager,
    getThreadManager,
} from "../agents/microsoft";

const router = Router();

/**
 * GET /api/microsoft/status
 * Get Microsoft Agent Framework status
 */
router.get("/status", async (req: Request, res: Response) => {
    try {
        const status = await getMicrosoftAgentFrameworkStatus();
        res.json({
            success: true,
            data: status,
        });
    } catch (error) {
        logger.error({ error }, "Failed to get Microsoft Agent Framework status");
        res.status(500).json({
            success: false,
            error: "Failed to get status",
        });
    }
});

/**
 * POST /api/microsoft/initialize
 * Initialize Microsoft Agent Framework
 */
router.post("/initialize", async (req: Request, res: Response) => {
    try {
        const {
            enableOrchestration = false,
            enableThreadManagement = false,
            enableTelemetry = false,
            enablePluginSystem = false,
            debugMode = false,
        } = req.body;

        const result = await initializeMicrosoftAgentFramework({
            enableOrchestration,
            enableThreadManagement,
            enableTelemetry,
            enablePluginSystem,
            debugMode,
        });

        res.json({
            success: result.success,
            data: result,
        });
    } catch (error) {
        logger.error({ error }, "Failed to initialize Microsoft Agent Framework");
        res.status(500).json({
            success: false,
            error: "Failed to initialize",
        });
    }
});

/**
 * GET /api/microsoft/telemetry
 * Get telemetry metrics
 */
router.get("/telemetry", async (req: Request, res: Response) => {
    try {
        const telemetryService = getTelemetryService();
        const metrics = telemetryService.getMetrics();
        
        res.json({
            success: true,
            data: metrics,
        });
    } catch (error) {
        logger.error({ error }, "Failed to get telemetry metrics");
        res.status(500).json({
            success: false,
            error: "Failed to get telemetry",
        });
    }
});

/**
 * GET /api/microsoft/telemetry/performance
 * Get agent performance report
 */
router.get("/telemetry/performance", async (req: Request, res: Response) => {
    try {
        const telemetryService = getTelemetryService();
        const report = telemetryService.getAgentPerformanceReport();
        
        res.json({
            success: true,
            data: report,
        });
    } catch (error) {
        logger.error({ error }, "Failed to get performance report");
        res.status(500).json({
            success: false,
            error: "Failed to get performance report",
        });
    }
});

/**
 * GET /api/microsoft/telemetry/business
 * Get business intelligence report
 */
router.get("/telemetry/business", async (req: Request, res: Response) => {
    try {
        const telemetryService = getTelemetryService();
        const report = telemetryService.getBusinessIntelligenceReport();
        
        res.json({
            success: true,
            data: report,
        });
    } catch (error) {
        logger.error({ error }, "Failed to get business intelligence report");
        res.status(500).json({
            success: false,
            error: "Failed to get business intelligence report",
        });
    }
});

/**
 * GET /api/microsoft/plugins
 * List all plugins
 */
router.get("/plugins", async (req: Request, res: Response) => {
    try {
        const pluginManager = getPluginManager();
        const plugins = pluginManager.listPlugins();
        
        res.json({
            success: true,
            data: plugins,
        });
    } catch (error) {
        logger.error({ error }, "Failed to list plugins");
        res.status(500).json({
            success: false,
            error: "Failed to list plugins",
        });
    }
});

/**
 * GET /api/microsoft/plugins/health
 * Get plugin health status
 */
router.get("/plugins/health", async (req: Request, res: Response) => {
    try {
        const pluginManager = getPluginManager();
        const health = pluginManager.getPluginHealth();
        
        res.json({
            success: true,
            data: health,
        });
    } catch (error) {
        logger.error({ error }, "Failed to get plugin health");
        res.status(500).json({
            success: false,
            error: "Failed to get plugin health",
        });
    }
});

/**
 * POST /api/microsoft/plugins/register
 * Register a new plugin
 */
router.post("/plugins/register", async (req: Request, res: Response) => {
    try {
        const { plugin, config } = req.body;
        
        if (!plugin || !plugin.name || !plugin.version || !plugin.execute) {
            return res.status(400).json({
                success: false,
                error: "Invalid plugin format",
            });
        }

        const pluginManager = getPluginManager();
        const success = await pluginManager.registerPlugin(plugin, config);
        
        res.json({
            success,
            data: { registered: success },
        });
    } catch (error) {
        logger.error({ error }, "Failed to register plugin");
        res.status(500).json({
            success: false,
            error: "Failed to register plugin",
        });
    }
});

/**
 * PUT /api/microsoft/plugins/:name/config
 * Update plugin configuration
 */
router.put("/plugins/:name/config", async (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        const config = req.body;
        
        const pluginManager = getPluginManager();
        const success = pluginManager.updatePluginConfig(name, config);
        
        res.json({
            success,
            data: { updated: success },
        });
    } catch (error) {
        logger.error({ error }, "Failed to update plugin config");
        res.status(500).json({
            success: false,
            error: "Failed to update plugin config",
        });
    }
});

/**
 * DELETE /api/microsoft/plugins/:name
 * Unregister a plugin
 */
router.delete("/plugins/:name", async (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        
        const pluginManager = getPluginManager();
        const success = await pluginManager.unregisterPlugin(name);
        
        res.json({
            success,
            data: { unregistered: success },
        });
    } catch (error) {
        logger.error({ error }, "Failed to unregister plugin");
        res.status(500).json({
            success: false,
            error: "Failed to unregister plugin",
        });
    }
});

/**
 * GET /api/microsoft/threads/:threadId
 * Get thread information
 */
router.get("/threads/:threadId", async (req: Request, res: Response) => {
    try {
        const { threadId } = req.params;
        
        const threadManager = getThreadManager();
        const thread = threadManager.getThreadContext(threadId);
        
        if (!thread) {
            return res.status(404).json({
                success: false,
                error: "Thread not found",
            });
        }
        
        res.json({
            success: true,
            data: thread,
        });
    } catch (error) {
        logger.error({ error }, "Failed to get thread");
        res.status(500).json({
            success: false,
            error: "Failed to get thread",
        });
    }
});

/**
 * GET /api/microsoft/threads/:threadId/summary
 * Get thread conversation summary
 */
router.get("/threads/:threadId/summary", async (req: Request, res: Response) => {
    try {
        const { threadId } = req.params;
        
        const threadManager = getThreadManager();
        const summary = threadManager.getConversationSummary(threadId);
        
        res.json({
            success: true,
            data: { summary },
        });
    } catch (error) {
        logger.error({ error }, "Failed to get thread summary");
        res.status(500).json({
            success: false,
            error: "Failed to get thread summary",
        });
    }
});

/**
 * PUT /api/microsoft/config
 * Update hybrid controller configuration
 */
router.put("/config", async (req: Request, res: Response) => {
    try {
        const config = req.body;
        
        const hybridController = getHybridController();
        hybridController.updateConfig(config);
        
        res.json({
            success: true,
            data: { config: hybridController.getConfig() },
        });
    } catch (error) {
        logger.error({ error }, "Failed to update configuration");
        res.status(500).json({
            success: false,
            error: "Failed to update configuration",
        });
    }
});

/**
 * GET /api/microsoft/stats
 * Get processing statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
    try {
        const hybridController = getHybridController();
        const stats = hybridController.getProcessingStats();
        
        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        logger.error({ error }, "Failed to get processing stats");
        res.status(500).json({
            success: false,
            error: "Failed to get processing stats",
        });
    }
});

export default router;