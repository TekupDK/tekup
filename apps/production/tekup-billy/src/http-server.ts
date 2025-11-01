/**
 * HTTP Server Wrapper for Tekup-Billy MCP Server
 *
 * Converts the stdio-based MCP protocol to HTTP REST API
 * for standalone cloud deployment on Railway, Render.com, AWS, etc.
 *
 * Architecture:
 * - Express.js HTTP server listening on PORT (default 3000)
 * - Token-based authentication via X-API-Key header
 * - Direct calls to MCP tool functions (bypasses stdio protocol)
 * - Compatible with RenOS backend, ChatGPT, Claude, and other HTTP clients
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import compression from "compression";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import RedisStore from "rate-limit-redis";
import { fileURLToPath } from "url";
import { z } from "zod";
import { BillyClient } from "./billy-client.js";
import { getBillyConfig } from "./config.js";
import { isSupabaseEnabled } from "./database/supabase-client.js";
import { createAuditor } from "./middleware/audit-logger.js";
import { initializeHealthMonitoring } from "./monitoring/health-monitor.js";
import { log } from "./utils/logger.js";
import {
  getRedisClient,
  initializeRedis,
  isRedisEnabled,
  RedisSessionStore,
} from "./utils/redis-client.js";

// Import Streamable HTTP transport (new MCP standard 2025-03-26)
import {
  handleMcpDelete,
  handleMcpGet,
  handleMcpPost,
} from "./mcp-streamable-transport.js";

// Import all tool modules
import * as analyticsTools from "./tools/analytics.js";
import * as customerTools from "./tools/customers.js";
import * as debugTools from "./tools/debug.js";
import * as invoiceTools from "./tools/invoices.js";
import * as opsTools from "./tools/ops.js";
import * as productTools from "./tools/products.js";
import * as revenueTools from "./tools/revenue.js";
import * as testRunnerTools from "./tools/test-runner.js";

// Types
interface ToolCallRequest {
  tool: string;
  arguments: Record<string, any>;
}

interface ToolCallResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
}

interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  billy: {
    connected: boolean;
    organization: string;
  };
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = "v1";

type AuditAction = "read" | "create" | "update" | "delete";

const toolAuditActions: Record<string, AuditAction> = {
  // Invoice tools
  list_invoices: "read",
  create_invoice: "create",
  get_invoice: "read",
  send_invoice: "update",
  update_invoice: "update",
  approve_invoice: "update",
  cancel_invoice: "update",
  mark_invoice_paid: "update",

  // Customer tools
  list_customers: "read",
  create_customer: "create",
  get_customer: "read",
  update_customer: "update",

  // Product tools
  list_products: "read",
  create_product: "create",
  update_product: "update",

  // Revenue tools
  get_revenue: "read",

  // Test runner tools
  list_test_scenarios: "read",
  run_test_scenario: "create",
  generate_test_data: "create",

  // Debug tools
  validate_auth: "read",
  test_connection: "read",

  // Analytics tools
  analyze_feedback: "read",
  analyze_usage_data: "read",
  analyze_adoption_risks: "read",
  analyze_ab_test: "read",
  analyze_segment_adoption: "read",

  // Ops tools
  list_audit_logs: "read",
  run_ops_check: "read",
};

// Trust proxy for Railway/Render.com (required for rate limiting with X-Forwarded-For)
// Set to 1 to only trust the first proxy (load balancer)
app.set("trust proxy", 1);

// Initialize Redis for distributed state
initializeRedis();

// Initialize Supabase (triggers connection check and logging)
const supabaseAvailable = isSupabaseEnabled();
if (supabaseAvailable) {
  log.info("Supabase integration active for audit logging and caching");
}

// Initialize enhanced health monitoring
const healthMonitor = initializeHealthMonitoring();

// Billy client instance
let billyClient: BillyClient;
let organizationId: string | null = null;

// Session storage (in-memory fallback if Redis unavailable)
const sseTransports: Record<string, SSEServerTransport> = {};
const sessionStore = new RedisSessionStore("billy-mcp-by-tekup:sse:", 3600);

// HTTP Keep-Alive agents for connection pooling
const httpAgent = new HttpAgent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

const httpsAgent = new HttpsAgent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Response compression (60-80% bandwidth savings)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "X-API-Key",
      "Authorization",
      "Accept",
      "Mcp-Session-Id",
      "Origin",
      "User-Agent",
    ],
    exposedHeaders: ["Mcp-Session-Id"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (distributed via Redis if available)
const limiter = (() => {
  const redisClient = getRedisClient();

  if (redisClient && isRedisEnabled()) {
    log.info("Rate limiter: Using Redis for distributed rate limiting");
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      validate: { trustProxy: false }, // Disable trust proxy validation (we handle it explicitly)
      store: new RedisStore({
        // @ts-ignore - RedisStore types mismatch with rate-limit-redis
        client: redisClient,
        prefix: "tekup-billy:ratelimit:",
      }),
      message: "Too many requests from this IP, please try again later.",
    });
  } else {
    log.warn(
      "Rate limiter: Using in-memory (not distributed across instances)"
    );
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      validate: { trustProxy: false }, // Disable trust proxy validation (we handle it explicitly)
      message: "Too many requests from this IP, please try again later.",
    });
  }
})();

app.use(`/api/${API_VERSION}/`, limiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    log.info("HTTP Request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Support multiple authentication methods:
  // 1. X-API-Key header
  // 2. Authorization: Bearer <token> header
  // 3. ?apiKey=<token> query parameter (for Shortwave compatibility)
  const apiKey =
    req.headers["x-api-key"] ||
    req.headers["authorization"]?.replace("Bearer ", "") ||
    req.query.apiKey;
  const validApiKey = process.env.MCP_API_KEY;

  // If no API key is configured, allow all requests (development mode)
  if (!validApiKey) {
    log.warn("MCP_API_KEY not set - authentication disabled");
    return next();
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized - Invalid or missing API key",
      message:
        "Please provide a valid X-API-Key header or ?apiKey=<token> query parameter",
    });
  }

  next();
};

// Tool registry mapping
const toolRegistry: Record<
  string,
  (client: BillyClient, args: unknown) => Promise<any>
> = {
  // Invoice tools
  list_invoices: invoiceTools.listInvoices,
  create_invoice: invoiceTools.createInvoice,
  get_invoice: invoiceTools.getInvoice,
  send_invoice: invoiceTools.sendInvoice,
  update_invoice: invoiceTools.updateInvoice,
  approve_invoice: invoiceTools.approveInvoice,
  cancel_invoice: invoiceTools.cancelInvoice,
  mark_invoice_paid: invoiceTools.markInvoicePaid,

  // Customer tools
  list_customers: customerTools.listCustomers,
  create_customer: customerTools.createCustomer,
  get_customer: customerTools.getCustomer,
  update_customer: customerTools.updateCustomer,

  // Product tools
  list_products: productTools.listProducts,
  create_product: productTools.createProduct,
  update_product: productTools.updateProduct,

  // Revenue tools
  get_revenue: revenueTools.getRevenue,

  // Test runner tools
  list_test_scenarios: testRunnerTools.listTestScenarios,
  run_test_scenario: testRunnerTools.runTestScenario,
  generate_test_data: testRunnerTools.generateTestData,

  // Debug tools
  validate_auth: debugTools.validateAuth,
  test_connection: debugTools.testConnection,

  // Analytics tools
  analyze_feedback: analyticsTools.analyzeFeedback,
  analyze_usage_data: analyticsTools.analyzeUsageData,
  analyze_adoption_risks: analyticsTools.analyzeAdoptionRisks,
  analyze_ab_test: analyticsTools.analyzeABTest,
  analyze_segment_adoption: analyticsTools.analyzeSegmentAdoption,

  // Ops tools
  list_audit_logs: opsTools.listAuditLogs,
  run_ops_check: opsTools.runOpsCheck,
};

// Routes

/**
 * Root endpoint
 * GET / - Server info
 * POST / - MCP protocol (ChatGPT compatibility)
 */
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    service: "Billy-mcp By Tekup",
    version: "2.0.0",
    status: "OK",
    endpoints: {
      health: "/health",
      mcp: "/mcp",
      mcp_root: "/ (POST for ChatGPT compatibility)",
      api: "/api/v1/tools",
      documentation: "https://github.com/TekupDK/Tekup-Billy",
    },
  });
});

// ChatGPT compatibility: POST / with JSON-only response (no SSE)
app.post("/", (req: Request, res: Response) => {
  log.info("[ChatGPT] POST / - JSON-only MCP handler");

  // Force JSON response by overriding Accept header
  req.headers["accept"] = "application/json";

  // Set timeout to prevent hanging
  req.setTimeout(15000, () => {
    if (!res.headersSent) {
      log.error("POST / timeout after 15s");
      res.status(408).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Request timeout" },
      });
    }
  });

  // Ensure response is sent
  Promise.resolve(handleMcpPost(req, res)).catch((err) => {
    log.error("MCP POST / error", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal error" },
      });
    }
  });
});

/**
 * MCP Discovery endpoint (/.well-known/mcp.json)
 * For universal MCP plugin discovery
 */
app.get("/.well-known/mcp.json", (req: Request, res: Response) => {
  res.json({
    version: "2025-03-26",
    name: "Billy-mcp By Tekup",
    description:
      "Billy-mcp By Tekup - Model Context Protocol server for Billy.dk accounting API - invoice, customer, product, and revenue management",
    vendor: {
      name: "Tekup - Rendetalje ApS",
      url: "https://tekup.dk",
    },
    endpoints: {
      mcp: {
        url: "/mcp",
        transport: "streamable-http",
        methods: ["POST", "GET", "DELETE"],
        authentication: {
          type: "none",
          note: "MCP endpoint is public. Use /api/v1 for authenticated REST API.",
        },
      },
      health: {
        url: "/health",
        method: "GET",
      },
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false,
      sampling: false,
    },
    protocolVersions: ["2025-03-26", "2025-06-18"],
    contact: {
      email: "support@tekup.dk",
      url: "https://github.com/TekupDK/Tekup-Billy",
    },
  });
});

/**
 * Health check endpoint - simple and fast for Railway
 * GET /health
 */
app.get("/health", async (req: Request, res: Response) => {
  try {
    // Simple health check - always returns 200 if server is running
    // Railway just needs to know the server is up and responding
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "billy-mcp-by-tekup",
      uptime: process.uptime(),
    });
  } catch (error) {
    // Even if error, return 200 to keep Railway happy during startup
    log.error("Health check error (non-fatal)", error);
    res.status(200).json({
      status: "starting",
      timestamp: new Date().toISOString(),
      service: "billy-mcp-by-tekup",
    });
  }
});

/**
 * Enhanced health check endpoint with comprehensive monitoring
 * GET /health/detailed
 */
app.get("/health/detailed", async (req: Request, res: Response) => {
  try {
    const systemHealth = await healthMonitor.performHealthCheck();

    const statusCode =
      systemHealth.status === "healthy"
        ? 200
        : systemHealth.status === "degraded"
          ? 200
          : 503;

    res.status(statusCode).json(systemHealth);
  } catch (error) {
    log.error("Detailed health check failed", error);
    res.status(503).json({
      status: "unhealthy",
      error: "Health check system failure",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Version and diagnostics endpoint
 * GET /version
 */
app.get("/version", (req: Request, res: Response) => {
  const config = getBillyConfig();

  // Count registered tools
  const toolCount = Object.keys(toolRegistry).length;

  // Get git SHA from environment (set by Railway/Render)
  const gitSHA =
    process.env.RAILWAY_GIT_COMMIT ||
    process.env.RENDER_GIT_COMMIT ||
    "unknown";

  res.status(200).json({
    version: process.env.npm_package_version || "2.0.0",
    gitCommit: gitSHA,
    gitShort: gitSHA.substring(0, 7),
    toolsRegistered: toolCount,
    toolsList: Object.keys(toolRegistry).sort(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development",
    billyOrg: config.organizationId,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Health check endpoint (Render.com default)
 * GET /healthz
 */
app.get("/healthz", async (req: Request, res: Response) => {
  const config = getBillyConfig();

  const healthCheck: HealthCheckResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.4.4",
    uptime: process.uptime(),
    billy: {
      connected: !!billyClient,
      organization: config.organizationId,
    },
  };

  res.status(200).json(healthCheck);
});

/**
 * Prometheus metrics endpoint
 * GET /health/metrics
 */
app.get("/health/metrics", (req: Request, res: Response) => {
  const metrics = healthMonitor.exportPrometheusMetrics();
  res.status(200).type("text/plain").send(metrics);
});

/**
 * Health metrics JSON endpoint
 * GET /health/metrics/json
 */
app.get("/health/metrics/json", (req: Request, res: Response) => {
  const metrics = healthMonitor.getMetrics();
  res.status(200).json(metrics);
});

/**
 * Scaling recommendations endpoint
 * GET /health/scaling
 */
app.get("/health/scaling", (req: Request, res: Response) => {
  const recommendations = healthMonitor.generateScalingRecommendation();
  res.status(200).json(recommendations);
});

/**
 * OAuth Discovery Endpoints (for Claude Desktop compatibility)
 * These endpoints indicate that this server does not support OAuth
 */
app.get(
  "/.well-known/oauth-authorization-server",
  (req: Request, res: Response) => {
    res.status(200).json({
      issuer: `https://${req.get("host")}`,
      authorization_endpoint: null,
      token_endpoint: null,
      grant_types_supported: ["api_key"],
      response_types_supported: [],
      token_endpoint_auth_methods_supported: ["client_secret_post"],
      service_documentation: "https://github.com/TekupDK/Tekup-Billy",
      ui_locales_supported: ["en-US", "da-DK"],
    });
  }
);

app.get(
  "/.well-known/oauth-authorization-server/mcp",
  (req: Request, res: Response) => {
    res.status(200).json({
      message: "This MCP server does not require authentication",
      authentication: {
        type: "none",
        note: "MCP endpoints are open. REST API endpoints require X-API-Key header.",
      },
    });
  }
);

app.get(
  "/.well-known/oauth-protected-resource/mcp",
  (req: Request, res: Response) => {
    res.status(200).json({
      resource: "tekup-billy-mcp",
      authorization_servers: [],
      scopes_supported: ["read", "write"],
      bearer_methods_supported: ["header", "query"],
      resource_documentation: "https://github.com/TekupDK/Tekup-Billy",
    });
  }
);

/**
 * OAuth Registration Endpoint
 * POST /register
 *
 * Returns success but no-op (Claude Desktop checks for this)
 */
app.post("/register", (req: Request, res: Response) => {
  log.info("Registration request", { ip: req.ip });

  res.status(200).json({
    success: true,
    message: "Registration acknowledged",
    note: "This server does not require OAuth registration. MCP endpoints are publicly accessible.",
    client_id: "tekup-billy-mcp",
    authentication: "none",
  });
});

/**
 * MCP Streamable HTTP Transport (Protocol Version 2025-03-26)
 *
 * Single /mcp endpoint that handles both POST and GET requests.
 * This replaces the deprecated HTTP+SSE transport (2024-11-05).
 *
 * NO AUTHENTICATION REQUIRED - MCP handles auth separately
 */

/**
 * POST /mcp - Send JSON-RPC messages
 * Returns JSON response or SSE stream based on Accept header
 */
app.post("/mcp", handleMcpPost);

/**
 * GET /mcp - Open SSE stream for server-initiated messages
 * Optional endpoint for bidirectional communication
 */
app.get("/mcp", handleMcpGet);

/**
 * DELETE /mcp - Explicitly terminate session
 * Client can optionally call this to clean up
 */
app.delete("/mcp", handleMcpDelete);

/**
 * LEGACY ENDPOINTS (Backwards Compatibility)
 * Support old HTTP+SSE transport (2024-11-05) for existing clients
 */
app.get("/mcp/legacy", async (req: Request, res: Response): Promise<void> => {
  log.info("[LEGACY] MCP SSE connection requested", { ip: req.ip });

  try {
    // Create new SSE transport for this connection
    const transport = new SSEServerTransport("/mcp/messages", res);
    const sessionId = transport.sessionId;

    // Store transport by session ID
    sseTransports[sessionId] = transport;

    // Set up onclose handler to clean up transport
    transport.onclose = () => {
      log.info("[LEGACY] MCP SSE connection closed", { sessionId });
      delete sseTransports[sessionId];
    };

    // Create new MCP server instance for this connection
    const mcpServer = new McpServer({
      name: "tekup-billy-server",
      version: "1.4.4",
    });

    // Register all tools with the MCP server
    setupMcpTools(mcpServer);

    // Connect the transport to the MCP server
    await mcpServer.connect(transport);

    log.info("[LEGACY] MCP SSE connection established", { sessionId });
  } catch (error) {
    log.error("[LEGACY] MCP SSE error", error);
    if (!res.headersSent) {
      res.status(500).send("Failed to establish MCP SSE connection");
    }
  }
});

app.post(
  "/mcp/messages",
  async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      log.error("[LEGACY] No session ID provided in request");
      res.status(400).send("Missing sessionId parameter");
      return;
    }

    const transport = sseTransports[sessionId];
    if (!transport) {
      log.error("[LEGACY] No active transport found", { sessionId });
      res.status(404).send("Session not found");
      return;
    }

    log.info("[LEGACY] MCP message received", { sessionId });

    try {
      // Handle the POST message with the transport
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      log.error("[LEGACY] Error handling MCP message", error);
      if (!res.headersSent) {
        res.status(500).send("Error handling request");
      }
    }
  }
);

/**
 * List available tools
 * GET /api/v1/tools
 */
app.get(
  `/api/${API_VERSION}/tools`,
  authenticate,
  (req: Request, res: Response) => {
    const tools = Object.keys(toolRegistry).map((toolName) => ({
      name: toolName,
      category: getToolCategory(toolName),
      description: getToolDescription(toolName),
    }));

    res.json({
      success: true,
      data: {
        tools,
        total: tools.length,
      },
    });
  }
);

/**
 * Execute a specific tool
 * POST /api/v1/tools/:toolName
 *
 * Body: { arguments: { ... } }
 */
app.post(
  `/api/${API_VERSION}/tools/:toolName`,
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { toolName } = req.params;
    const args = req.body.arguments || req.body;

    const startTime = Date.now();
    const auditContext = getAuditContext(req);
    const requestAuditor =
      supabaseAvailable && organizationId
        ? createAuditor(
            organizationId,
            auditContext.userId,
            auditContext.ipAddress,
            auditContext.userAgent
          )
        : null;

    try {
      // Validate tool exists
      const toolFunction = toolName ? toolRegistry[toolName] : undefined;
      if (!toolFunction) {
        res.status(404).json({
          success: false,
          error: `Tool '${toolName}' not found`,
          availableTools: Object.keys(toolRegistry),
        });
        return;
      }

      // Execute tool
      log.mcpTool(toolName!, "start", { args });
      const auditAction = toolAuditActions[toolName!] ?? "read";
      const executeTool = requestAuditor
        ? requestAuditor.wrap(
            toolName!,
            auditAction,
            async (wrappedArgs: unknown) => {
              return await toolFunction(billyClient, wrappedArgs);
            }
          )
        : async (wrappedArgs: unknown) =>
            toolFunction(billyClient, wrappedArgs);

      const result = await executeTool(args);

      const executionTime = Date.now() - startTime;
      log.mcpTool(toolName!, "success", { executionTime });
      healthMonitor.recordRequest(true, executionTime, false);

      // Return response
      const response: ToolCallResponse = {
        success: true,
        data: result,
        executionTime,
      };

      res.json(response);
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      log.mcpTool(toolName!, "error", { error: error.message, executionTime });

      // Record health metrics (error)
      healthMonitor.recordRequest(false, executionTime, false);

      const response: ToolCallResponse = {
        success: false,
        error: error.message || "Tool execution failed",
        executionTime,
      };

      res.status(500).json(response);
    }
  }
);

/**
 * Batch tool execution
 * POST /api/v1/tools/batch
 *
 * Body: {
 *   tools: [
 *     { tool: "list_invoices", arguments: {...} },
 *     { tool: "list_customers", arguments: {...} }
 *   ]
 * }
 */
app.post(
  `/api/${API_VERSION}/tools/batch`,
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { tools } = req.body;

    if (!Array.isArray(tools)) {
      res.status(400).json({
        success: false,
        error: 'Request body must contain a "tools" array',
      });
      return;
    }

    const startTime = Date.now();
    const results: any[] = [];
    const auditContext = getAuditContext(req);
    const requestAuditor =
      supabaseAvailable && organizationId
        ? createAuditor(
            organizationId,
            auditContext.userId,
            auditContext.ipAddress,
            auditContext.userAgent
          )
        : null;

    try {
      // Execute tools sequentially (to maintain order and avoid rate limit issues)
      for (const toolCall of tools) {
        const { tool, arguments: args } = toolCall;

        const toolFunction = toolRegistry[tool];
        if (!toolFunction) {
          results.push({
            tool,
            success: false,
            error: `Tool '${tool}' not found`,
          });
          continue;
        }

        const toolStartTime = Date.now();

        try {
          const auditAction = toolAuditActions[tool] ?? "read";
          const executeTool = requestAuditor
            ? requestAuditor.wrap(
                tool,
                auditAction,
                async (wrappedArgs: unknown) => {
                  return await toolFunction(billyClient, wrappedArgs);
                }
              )
            : async (wrappedArgs: unknown) =>
                toolFunction(billyClient, wrappedArgs);

          const result = await executeTool(args);
          const toolExecutionTime = Date.now() - toolStartTime;
          healthMonitor.recordRequest(true, toolExecutionTime, false);

          results.push({
            tool,
            success: true,
            data: result,
          });
        } catch (error: any) {
          // Record health metrics for failed batch operation
          const toolExecutionTime = Date.now() - toolStartTime;
          healthMonitor.recordRequest(false, toolExecutionTime, false);

          results.push({
            tool,
            success: false,
            error: error.message,
          });
        }
      }

      const executionTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          results,
          total: tools.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        },
        executionTime,
      });
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      res.status(500).json({
        success: false,
        error: error.message,
        executionTime,
      });
    }
  }
);

/**
 * Generic tool execution endpoint (for MCP compatibility)
 * POST /api/v1/call
 *
 * Body: { tool: "list_invoices", arguments: {...} }
 */
app.post(
  `/api/${API_VERSION}/call`,
  authenticate,
  async (req: Request, res: Response) => {
    const { tool, arguments: args } = req.body;

    if (!tool) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: tool",
      });
    }

    // Redirect to specific tool endpoint
    req.params.toolName = tool;
    req.body.arguments = args;

    return app._router.handle(req, res);
  }
);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log.error("Unhandled error", err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
    availableEndpoints: [
      "GET /health",
      `GET /api/${API_VERSION}/tools`,
      `POST /api/${API_VERSION}/tools/:toolName`,
      `POST /api/${API_VERSION}/tools/batch`,
      `POST /api/${API_VERSION}/call`,
    ],
  });
});

// Helper functions
function getToolCategory(toolName: string): string {
  if (toolName.includes("invoice")) return "invoices";
  if (toolName.includes("customer")) return "customers";
  if (toolName.includes("product")) return "products";
  if (toolName.includes("revenue")) return "revenue";
  if (toolName.includes("test") || toolName.includes("generate"))
    return "testing";
  return "general";
}

function getToolDescription(toolName: string): string {
  const descriptions: Record<string, string> = {
    list_invoices: "List invoices from Billy with optional filters",
    create_invoice: "Create a new invoice in Billy",
    get_invoice: "Get details of a specific invoice",
    send_invoice: "Send an invoice to customer via email",
    update_invoice: "Update an existing invoice",
    approve_invoice: "Approve an invoice (draft to approved)",
    cancel_invoice: "Cancel an invoice",
    mark_invoice_paid: "Mark an invoice as paid",
    list_customers: "List customers/contacts from Billy",
    create_customer: "Create a new customer in Billy",
    get_customer: "Get details of a specific customer",
    update_customer: "Update an existing customer",
    list_products: "List products from Billy",
    create_product: "Create a new product in Billy",
    update_product: "Update an existing product",
    get_revenue: "Get revenue analytics from Billy",
    list_test_scenarios: "List available test scenarios",
    run_test_scenario: "Run a specific test scenario",
    generate_test_data: "Generate test data for a business type",
  };

  return descriptions[toolName] || "No description available";
}

/**
 * Setup MCP tools on a server instance
 */
function setupMcpTools(server: McpServer): void {
  if (!billyClient) {
    throw new Error("Billy client not initialized");
  }

  const client = billyClient;

  // Invoice tools
  server.tool(
    "list_invoices",
    "List invoices from Billy with optional filters",
    {
      state: z
        .enum(["draft", "approved", "sent", "paid", "cancelled"])
        .optional()
        .describe("Filter by invoice state"),
      contactId: z
        .string()
        .optional()
        .describe("Filter by customer contact ID"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of invoices to return"),
    },
    async (args) => invoiceTools.listInvoices(client, args)
  );

  server.tool(
    "create_invoice",
    "Create a new invoice in Billy",
    {
      contactId: z.string().describe("Customer contact ID"),
      entryDate: z.string().describe("Invoice date (YYYY-MM-DD)"),
      lines: z
        .array(
          z.object({
            productId: z.string().describe("Product ID"),
            description: z.string().describe("Line description"),
            quantity: z.number().describe("Quantity"),
            unitPrice: z.number().describe("Unit price"),
          })
        )
        .describe("Invoice lines"),
    },
    async (args) => invoiceTools.createInvoice(client, args)
  );

  server.tool(
    "get_invoice",
    "Get details of a specific invoice",
    {
      invoiceId: z.string().describe("Invoice ID"),
    },
    async (args) => invoiceTools.getInvoice(client, args)
  );

  server.tool(
    "send_invoice",
    "Send an invoice to the customer",
    {
      invoiceId: z.string().describe("Invoice ID"),
      method: z.enum(["email"]).describe("Delivery method"),
    },
    async (args) => invoiceTools.sendInvoice(client, args)
  );

  // Sprint 1: Invoice lifecycle tools
  server.tool(
    "update_invoice",
    "Update an existing invoice",
    {
      invoiceId: z.string().describe("Invoice ID to update"),
      contactId: z.string().optional().describe("Customer contact ID"),
      entryDate: z.string().optional().describe("Invoice date (YYYY-MM-DD)"),
      paymentTermsDays: z.number().optional().describe("Payment terms in days"),
      lines: z
        .array(
          z.object({
            description: z.string().describe("Line description"),
            quantity: z.number().describe("Quantity"),
            unitPrice: z.number().describe("Unit price"),
            productId: z
              .string()
              .describe("Product ID (required by Billy API)"),
          })
        )
        .optional()
        .describe("Invoice lines"),
    },
    async (args) => invoiceTools.updateInvoice(client, args)
  );

  server.tool(
    "approve_invoice",
    "Approve an invoice (draft to approved)",
    {
      invoiceId: z.string().describe("Invoice ID to approve"),
    },
    async (args) => invoiceTools.approveInvoice(client, args)
  );

  server.tool(
    "cancel_invoice",
    "Cancel an invoice",
    {
      invoiceId: z.string().describe("Invoice ID to cancel"),
      reason: z.string().optional().describe("Cancellation reason"),
    },
    async (args) => invoiceTools.cancelInvoice(client, args)
  );

  server.tool(
    "mark_invoice_paid",
    "Mark an invoice as paid",
    {
      invoiceId: z.string().describe("Invoice ID to mark as paid"),
      paymentDate: z.string().describe("Payment date (YYYY-MM-DD)"),
      amount: z.number().optional().describe("Payment amount"),
    },
    async (args) => invoiceTools.markInvoicePaid(client, args)
  );

  // Customer tools
  server.tool(
    "list_customers",
    "List customers from Billy",
    {
      limit: z
        .number()
        .optional()
        .describe("Maximum number of customers to return"),
    },
    async (args) => customerTools.listCustomers(client, args)
  );

  server.tool(
    "create_customer",
    "Create a new customer in Billy",
    {
      name: z.string().describe("Customer name"),
      email: z.string().optional().describe("Customer email"),
      phone: z.string().optional().describe("Customer phone"),
      address: z.string().optional().describe("Customer address"),
    },
    async (args) => customerTools.createCustomer(client, args)
  );

  server.tool(
    "get_customer",
    "Get details of a specific customer",
    {
      customerId: z.string().describe("Customer ID"),
    },
    async (args) => customerTools.getCustomer(client, args)
  );

  // Sprint 1: Update customer tool
  server.tool(
    "update_customer",
    "Update an existing customer",
    {
      contactId: z.string().describe("Customer contact ID to update"),
      name: z.string().optional().describe("Customer name"),
      email: z.string().optional().describe("Customer email"),
      phone: z.string().optional().describe("Customer phone"),
      address: z
        .object({
          street: z.string().optional(),
          city: z.string().optional(),
          zipcode: z.string().optional(),
          country: z.string().optional(),
        })
        .optional()
        .describe("Customer address"),
    },
    async (args) => customerTools.updateCustomer(client, args)
  );

  // Product tools
  server.tool(
    "list_products",
    "List products from Billy",
    {
      limit: z
        .number()
        .optional()
        .describe("Maximum number of products to return"),
    },
    async (args) => productTools.listProducts(client, args)
  );

  server.tool(
    "create_product",
    "Create a new product in Billy",
    {
      name: z.string().describe("Product name"),
      description: z.string().optional().describe("Product description"),
      price: z.number().describe("Product price"),
    },
    async (args) => productTools.createProduct(client, args)
  );

  // Sprint 1: Update product tool
  server.tool(
    "update_product",
    "Update an existing product",
    {
      productId: z.string().describe("Product ID to update"),
      name: z.string().optional().describe("Product name"),
      description: z.string().optional().describe("Product description"),
      prices: z
        .array(
          z.object({
            unitPrice: z.number().describe("Unit price"),
            currencyId: z.string().optional().describe("Currency ID"),
          })
        )
        .optional()
        .describe("Product prices"),
    },
    async (args) => productTools.updateProduct(client, args)
  );

  // Revenue tool
  server.tool(
    "get_revenue",
    "Get revenue analytics from Billy",
    {
      startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
    },
    async (args) => revenueTools.getRevenue(client, args)
  );

  // Test runner tools
  server.tool(
    "list_test_scenarios",
    "List available test scenarios",
    {},
    async (args) => testRunnerTools.listTestScenarios(client, args)
  );

  server.tool(
    "run_test_scenario",
    "Run a specific test scenario",
    {
      scenarioId: z.string().describe("Test scenario ID"),
    },
    async (args) => testRunnerTools.runTestScenario(client, args)
  );

  server.tool(
    "generate_test_data",
    "Generate test data for a business type",
    {
      businessType: z
        .string()
        .describe("Business type (e.g., retail, consulting)"),
    },
    async (args) => testRunnerTools.generateTestData(client, args)
  );

  // Debug tools
  server.tool(
    "validate_auth",
    "Validate Billy API authentication and connection",
    {},
    async (args) => debugTools.validateAuth(client, args)
  );

  server.tool(
    "test_connection",
    "Test connection to specific Billy API endpoint",
    {
      endpoint: z
        .string()
        .optional()
        .describe(
          "Endpoint to test (organization, contacts, products, invoices)"
        ),
    },
    async (args) => debugTools.testConnection(client, args)
  );

  // Ops tools
  server.tool(
    "list_audit_logs",
    "List today's audit logs from Supabase (server-side)",
    {
      sinceDate: z
        .string()
        .optional()
        .describe("ISO date (YYYY-MM-DD). Default: today"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe("Max rows (1-500). Default: 50"),
    },
    async (args) => opsTools.listAuditLogs(client, args)
  );

  server.tool(
    "run_ops_check",
    "Run end-to-end ops check (Billy auth + audit preview)",
    {
      includeDiagnostics: z
        .boolean()
        .optional()
        .describe("Include timing and environment info"),
    },
    async (args) => opsTools.runOpsCheck(client, args)
  );

  log.info("MCP tools registered", { toolCount: 23 });
}

// Server startup
async function startServer() {
  try {
    console.log("[STARTUP] Starting Tekup-Billy server...");
    console.log("[STARTUP] PORT:", process.env.PORT || 3000);
    console.log("[STARTUP] NODE_ENV:", process.env.NODE_ENV || "development");
    console.log(
      "[STARTUP] RAILWAY_ENVIRONMENT:",
      process.env.RAILWAY_ENVIRONMENT || "not set"
    );

    // Validate environment
    console.log("[STARTUP] Validating environment...");
    const config = getBillyConfig();
    console.log("[STARTUP] Environment validated:", {
      organizationId: config.organizationId,
      apiBase: config.apiBase,
    });
    log.info("Environment validated", {
      organizationId: config.organizationId,
      apiBase: config.apiBase,
      testMode: config.testMode,
      dryRun: config.dryRun,
    });

    organizationId = config.organizationId;

    // Initialize Billy client
    console.log("[STARTUP] Initializing Billy client...");
    billyClient = new BillyClient(config);
    console.log("[STARTUP] Billy client initialized");
    log.info("Billy client initialized");

    // Log registered tools count
    const toolCount = Object.keys(toolRegistry).length;
    console.log(`[STARTUP] Tools registered: ${toolCount}`);
    log.info("Tools registered", {
      count: toolCount,
      tools: Object.keys(toolRegistry).sort(),
    });

    // Start HTTP server (listen on 0.0.0.0 for container compatibility)
    app
      .listen(PORT, "0.0.0.0", () => {
        console.log(
          `[SERVER] Tekup-Billy MCP HTTP Server started on port ${PORT}`
        );
        log.info("Tekup-Billy MCP HTTP Server started", {
          httpApi: `http://0.0.0.0:${PORT}`,
          mcpSse: `http://0.0.0.0:${PORT}/mcp`,
          healthCheck: `http://0.0.0.0:${PORT}/health`,
          apiVersion: API_VERSION,
          toolCount: Object.keys(toolRegistry).length,
          nodeEnv: process.env.NODE_ENV,
          port: PORT,
        });

        if (!process.env.MCP_API_KEY) {
          log.warn("MCP_API_KEY not set - authentication is disabled");
        }
      })
      .on("error", (error) => {
        console.error("[SERVER] Failed to start HTTP server:", error);
        log.error("Failed to start HTTP server", error);
        process.exit(1);
      });
  } catch (error) {
    console.error("[STARTUP] Failed to start server:", error);
    if (error instanceof Error) {
      console.error("[STARTUP] Error message:", error.message);
      console.error("[STARTUP] Error stack:", error.stack);
    }
    log.error("Failed to start server", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  log.info("Shutting down gracefully (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", () => {
  log.info("Shutting down gracefully (SIGTERM)");
  process.exit(0);
});

// Start server - ALWAYS start if this file is executed
// In Docker container (Railway), this file is executed via: npx tsx src/http-server.ts
// So we always start - no conditions needed
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  fileURLToPath(import.meta.url) === process.argv[1] ||
  !import.meta.url.includes("node_modules");

// Always start - if this file runs, it's meant to start the server
if (true) {
  // Add unhandled error handlers before starting
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    log.error("Unhandled Rejection", { reason, promise });
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    log.error("Uncaught Exception", error);
    process.exit(1);
  });

  startServer().catch((error) => {
    console.error("Failed to start server:", error);
    log.error("Failed to start server", error);
    process.exit(1);
  });
}

export { app, startServer };

function getHeaderValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function getAuditContext(req: Request) {
  const userId = getHeaderValue(
    (req.headers["x-user-id"] as string | string[] | undefined) ??
      (req.headers["x-user"] as string | string[] | undefined) ??
      (req.headers["x-client-user"] as string | string[] | undefined)
  );

  return {
    userId,
    ipAddress: req.ip,
    userAgent: getHeaderValue(
      req.headers["user-agent"] as string | string[] | undefined
    ),
  };
}
