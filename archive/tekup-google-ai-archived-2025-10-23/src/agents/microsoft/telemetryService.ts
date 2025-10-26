import { logger } from "../../logger";
import { getThreadManager, type RenosThread, type AgentAction } from "./threadManager";

/**
 * Microsoft Agent Framework Telemetry Service
 * 
 * Provides enterprise-grade observability and monitoring
 * Replaces basic logging with structured telemetry
 */

export interface TelemetryMetrics {
    agentPerformance: AgentPerformanceMetrics[];
    customerSatisfaction: SatisfactionMetrics;
    businessKPIs: BusinessMetrics;
    errorTracking: ErrorAnalytics;
    complianceAudit: ComplianceLog[];
    systemHealth: SystemHealthMetrics;
}

export interface AgentPerformanceMetrics {
    agentType: string;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    errorRate: number;
    lastExecution: Date;
    performanceTrend: "improving" | "stable" | "declining";
}

export interface SatisfactionMetrics {
    averageRating: number;
    totalRatings: number;
    positiveRatings: number;
    negativeRatings: number;
    responseTime: number; // average in seconds
    resolutionRate: number; // percentage of issues resolved
}

export interface BusinessMetrics {
    totalLeads: number;
    conversionRate: number;
    averageLeadValue: number;
    totalRevenue: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    averageBookingValue: number;
    peakHours: string[];
    mostPopularService: string;
}

export interface ErrorAnalytics {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByAgent: Record<string, number>;
    criticalErrors: number;
    errorTrend: "increasing" | "stable" | "decreasing";
    lastError: Date;
    errorResolutionTime: number; // average in minutes
}

export interface ComplianceLog {
    id: string;
    timestamp: Date;
    action: string;
    userId?: string;
    customerId?: string;
    dataType: "personal" | "financial" | "communication";
    complianceStatus: "compliant" | "warning" | "violation";
    details: Record<string, unknown>;
}

export interface SystemHealthMetrics {
    uptime: number; // percentage
    responseTime: number; // average in ms
    memoryUsage: number; // percentage
    cpuUsage: number; // percentage
    activeThreads: number;
    databaseConnections: number;
    lastHealthCheck: Date;
}

/**
 * Telemetry Service for Microsoft Agent Framework
 */
export class RenosTelemetryService {
    private metrics: TelemetryMetrics;
    private threadManager = getThreadManager();
    private startTime: Date;

    constructor() {
        this.startTime = new Date();
        this.metrics = this.initializeMetrics();
    }

    /**
     * Track agent execution
     */
    async trackAgentExecution(
        agentType: string,
        action: string,
        success: boolean,
        executionTime: number,
        error?: string
    ): Promise<void> {
        try {
            // Update agent performance metrics
            const agentMetrics = this.metrics.agentPerformance.find(m => m.agentType === agentType);
            if (agentMetrics) {
                agentMetrics.totalExecutions++;
                agentMetrics.successRate = this.calculateSuccessRate(agentType);
                agentMetrics.averageExecutionTime = this.calculateAverageExecutionTime(agentType);
                agentMetrics.errorRate = this.calculateErrorRate(agentType);
                agentMetrics.lastExecution = new Date();
                agentMetrics.performanceTrend = this.calculatePerformanceTrend(agentType);
            } else {
                this.metrics.agentPerformance.push({
                    agentType,
                    totalExecutions: 1,
                    successRate: success ? 100 : 0,
                    averageExecutionTime: executionTime,
                    errorRate: success ? 0 : 100,
                    lastExecution: new Date(),
                    performanceTrend: "stable",
                });
            }

            // Track errors
            if (!success && error) {
                await this.trackError(agentType, action, error);
            }

            // Log structured telemetry
            logger.info({
                telemetry: {
                    type: "agent_execution",
                    agentType,
                    action,
                    success,
                    executionTime,
                    error,
                    timestamp: new Date().toISOString(),
                },
            }, "Agent execution tracked");

        } catch (error) {
            logger.error({ error, agentType, action }, "Failed to track agent execution");
        }
    }

    /**
     * Track customer interaction
     */
    async trackCustomerInteraction(
        customerId: string,
        interactionType: "lead" | "booking" | "complaint" | "followup",
        satisfaction?: number,
        responseTime?: number
    ): Promise<void> {
        try {
            // Update satisfaction metrics
            if (satisfaction !== undefined) {
                this.metrics.customerSatisfaction.totalRatings++;
                this.metrics.customerSatisfaction.averageRating = 
                    (this.metrics.customerSatisfaction.averageRating * (this.metrics.customerSatisfaction.totalRatings - 1) + satisfaction) 
                    / this.metrics.customerSatisfaction.totalRatings;

                if (satisfaction >= 4) {
                    this.metrics.customerSatisfaction.positiveRatings++;
                } else if (satisfaction <= 2) {
                    this.metrics.customerSatisfaction.negativeRatings++;
                }
            }

            if (responseTime !== undefined) {
                this.metrics.customerSatisfaction.responseTime = 
                    (this.metrics.customerSatisfaction.responseTime + responseTime) / 2;
            }

            // Log interaction
            logger.info({
                telemetry: {
                    type: "customer_interaction",
                    customerId,
                    interactionType,
                    satisfaction,
                    responseTime,
                    timestamp: new Date().toISOString(),
                },
            }, "Customer interaction tracked");

        } catch (error) {
            logger.error({ error, customerId, interactionType }, "Failed to track customer interaction");
        }
    }

    /**
     * Track business KPI
     */
    async trackBusinessKPI(
        kpiType: "lead" | "conversion" | "revenue" | "customer",
        value: number,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        try {
            switch (kpiType) {
                case "lead":
                    this.metrics.businessKPIs.totalLeads += value;
                    break;
                case "conversion":
                    this.metrics.businessKPIs.conversionRate = value;
                    break;
                case "revenue":
                    this.metrics.businessKPIs.totalRevenue += value;
                    break;
                case "customer":
                    this.metrics.businessKPIs.activeCustomers += value;
                    break;
            }

            logger.info({
                telemetry: {
                    type: "business_kpi",
                    kpiType,
                    value,
                    metadata,
                    timestamp: new Date().toISOString(),
                },
            }, "Business KPI tracked");

        } catch (error) {
            logger.error({ error, kpiType, value }, "Failed to track business KPI");
        }
    }

    /**
     * Track compliance event
     */
    async trackComplianceEvent(
        action: string,
        userId?: string,
        customerId?: string,
        dataType: "personal" | "financial" | "communication" = "personal",
        details?: Record<string, unknown>
    ): Promise<void> {
        try {
            const complianceLog: ComplianceLog = {
                id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                action,
                userId,
                customerId,
                dataType,
                complianceStatus: "compliant", // Would be determined by business rules
                details: details || {},
            };

            this.metrics.complianceAudit.push(complianceLog);

            // Keep only last 1000 compliance logs
            if (this.metrics.complianceAudit.length > 1000) {
                this.metrics.complianceAudit = this.metrics.complianceAudit.slice(-1000);
            }

            logger.info({
                telemetry: {
                    type: "compliance_event",
                    complianceId: complianceLog.id,
                    action,
                    dataType,
                    timestamp: new Date().toISOString(),
                },
            }, "Compliance event tracked");

        } catch (error) {
            logger.error({ error, action, userId, customerId }, "Failed to track compliance event");
        }
    }

    /**
     * Get current metrics
     */
    getMetrics(): TelemetryMetrics {
        // Update system health metrics
        this.updateSystemHealthMetrics();
        
        return { ...this.metrics };
    }

    /**
     * Get agent performance report
     */
    getAgentPerformanceReport(): {
        summary: {
            totalAgents: number;
            averageSuccessRate: number;
            totalExecutions: number;
            performanceIssues: string[];
        };
        agents: AgentPerformanceMetrics[];
    } {
        const agents = this.metrics.agentPerformance;
        const totalExecutions = agents.reduce((sum, agent) => sum + agent.totalExecutions, 0);
        const averageSuccessRate = agents.length > 0 
            ? agents.reduce((sum, agent) => sum + agent.successRate, 0) / agents.length 
            : 0;

        const performanceIssues = agents
            .filter(agent => agent.successRate < 80 || agent.errorRate > 20)
            .map(agent => `${agent.agentType}: ${agent.successRate}% success rate`);

        return {
            summary: {
                totalAgents: agents.length,
                averageSuccessRate,
                totalExecutions,
                performanceIssues,
            },
            agents,
        };
    }

    /**
     * Get business intelligence report
     */
    getBusinessIntelligenceReport(): {
        summary: BusinessMetrics;
        trends: {
            leadGrowth: number;
            revenueGrowth: number;
            customerGrowth: number;
        };
        recommendations: string[];
    } {
        const trends = {
            leadGrowth: 0, // Would be calculated from historical data
            revenueGrowth: 0,
            customerGrowth: 0,
        };

        const recommendations = [];
        if (this.metrics.businessKPIs.conversionRate < 30) {
            recommendations.push("Consider improving lead qualification process");
        }
        if (this.metrics.customerSatisfaction.averageRating < 4) {
            recommendations.push("Focus on customer satisfaction improvements");
        }
        if (this.metrics.agentPerformance.some(agent => agent.successRate < 80)) {
            recommendations.push("Review agent performance and consider retraining");
        }

        return {
            summary: this.metrics.businessKPIs,
            trends,
            recommendations,
        };
    }

    /**
     * Export metrics for external analysis
     */
    exportMetrics(): {
        timestamp: string;
        metrics: TelemetryMetrics;
        format: "json";
    } {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
            format: "json",
        };
    }

    // Private helper methods
    private initializeMetrics(): TelemetryMetrics {
        return {
            agentPerformance: [],
            customerSatisfaction: {
                averageRating: 0,
                totalRatings: 0,
                positiveRatings: 0,
                negativeRatings: 0,
                responseTime: 0,
                resolutionRate: 0,
            },
            businessKPIs: {
                totalLeads: 0,
                conversionRate: 0,
                averageLeadValue: 0,
                totalRevenue: 0,
                activeCustomers: 0,
                newCustomersThisMonth: 0,
                averageBookingValue: 0,
                peakHours: [],
                mostPopularService: "Fast Rengøring",
            },
            errorTracking: {
                totalErrors: 0,
                errorsByType: {},
                errorsByAgent: {},
                criticalErrors: 0,
                errorTrend: "stable",
                lastError: new Date(),
                errorResolutionTime: 0,
            },
            complianceAudit: [],
            systemHealth: {
                uptime: 100,
                responseTime: 0,
                memoryUsage: 0,
                cpuUsage: 0,
                activeThreads: 0,
                databaseConnections: 0,
                lastHealthCheck: new Date(),
            },
        };
    }

    private calculateSuccessRate(agentType: string): number {
        // This would calculate based on historical data
        return 85; // Placeholder
    }

    private calculateAverageExecutionTime(agentType: string): number {
        // This would calculate based on historical data
        return 1500; // Placeholder in ms
    }

    private calculateErrorRate(agentType: string): number {
        // This would calculate based on historical data
        return 5; // Placeholder percentage
    }

    private calculatePerformanceTrend(agentType: string): "improving" | "stable" | "declining" {
        // This would analyze historical performance data
        return "stable";
    }

    private async trackError(agentType: string, action: string, error: string): Promise<void> {
        this.metrics.errorTracking.totalErrors++;
        
        // Track by agent type
        this.metrics.errorTracking.errorsByAgent[agentType] = 
            (this.metrics.errorTracking.errorsByAgent[agentType] || 0) + 1;
        
        // Track by error type (simplified)
        const errorType = this.categorizeError(error);
        this.metrics.errorTracking.errorsByType[errorType] = 
            (this.metrics.errorTracking.errorsByType[errorType] || 0) + 1;
        
        this.metrics.errorTracking.lastError = new Date();
    }

    private categorizeError(error: string): string {
        if (error.includes("timeout")) return "timeout";
        if (error.includes("network")) return "network";
        if (error.includes("validation")) return "validation";
        if (error.includes("database")) return "database";
        return "unknown";
    }

    private updateSystemHealthMetrics(): void {
        // This would integrate with actual system monitoring
        this.metrics.systemHealth.lastHealthCheck = new Date();
        this.metrics.systemHealth.uptime = 99.9; // Placeholder
        this.metrics.systemHealth.responseTime = 150; // Placeholder
        this.metrics.systemHealth.memoryUsage = 45; // Placeholder
        this.metrics.systemHealth.cpuUsage = 25; // Placeholder
        this.metrics.systemHealth.activeThreads = 10; // Placeholder
        this.metrics.systemHealth.databaseConnections = 5; // Placeholder
    }
}

// Singleton instance
let telemetryService: RenosTelemetryService | null = null;

/**
 * Get the telemetry service instance
 */
export function getTelemetryService(): RenosTelemetryService {
    if (!telemetryService) {
        telemetryService = new RenosTelemetryService();
    }
    return telemetryService;
}