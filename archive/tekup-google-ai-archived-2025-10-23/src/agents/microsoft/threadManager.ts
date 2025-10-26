import { nanoid } from "nanoid";
import { logger } from "../../logger";
import { prisma } from "../../services/databaseService";
import type { ChatSessionContext, LeadInformation } from "../../types";

/**
 * Microsoft Agent Framework Thread-based State Management
 * 
 * Replaces simple ChatSessionContext with rich thread-based state
 * that persists across sessions and enables better multi-agent coordination
 */

export interface RenosThread {
    threadId: string;
    customerId?: string;
    leadId?: string;
    conversationId?: string;
    businessContext: BusinessContext;
    conversationState: ConversationState;
    agentHistory: AgentAction[];
    createdAt: Date;
    updatedAt: Date;
}

export interface BusinessContext {
    customerProfile?: CustomerProfile;
    leadHistory: LeadInformation[];
    currentLead?: LeadInformation;
    pricingHistory: PricingEstimate[];
    bookingHistory: BookingRecord[];
    escalationLevel: "none" | "low" | "medium" | "high" | "critical";
    lastContactDate?: Date;
    preferredCommunicationChannel: "email" | "phone" | "chat";
    timezone: string;
    language: string;
}

export interface CustomerProfile {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    totalLeads: number;
    totalBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    lastBookingDate?: Date;
    preferredServiceType?: string;
    specialRequests?: string[];
    satisfactionScore?: number;
    tags: string[];
}

export interface PricingEstimate {
    id: string;
    propertySize?: number;
    serviceType: string;
    estimatedHours: number;
    workers: number;
    totalPrice: number;
    actualHours?: number;
    actualPrice?: number;
    accuracy: number; // 0-100
    createdAt: Date;
}

export interface BookingRecord {
    id: string;
    scheduledAt: Date;
    serviceType: string;
    duration: number;
    status: "scheduled" | "completed" | "cancelled";
    customerSatisfaction?: number;
    notes?: string;
}

export interface ConversationState {
    currentIntent: string;
    confidence: number;
    pendingActions: string[];
    completedActions: string[];
    waitingForUserInput: boolean;
    lastUserMessage?: string;
    lastAgentResponse?: string;
    contextSummary: string;
}

export interface AgentAction {
    id: string;
    agentType: "intent-classifier" | "task-planner" | "plan-executor" | "email-agent" | "calendar-agent" | "pricing-agent";
    action: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    status: "pending" | "success" | "failed";
    timestamp: Date;
    duration?: number;
    error?: string;
}

/**
 * Thread Manager for Microsoft Agent Framework integration
 */
export class RenosThreadManager {
    private threads: Map<string, RenosThread> = new Map();

    /**
     * Create or get existing thread for customer/lead
     */
    async getOrCreateThread(
        customerId?: string,
        leadId?: string,
        conversationId?: string
    ): Promise<RenosThread> {
        const threadId = this.generateThreadId(customerId, leadId, conversationId);
        
        // Check if thread already exists
        let thread = this.threads.get(threadId);
        if (thread) {
            return thread;
        }

        // Load from database or create new
        thread = await this.loadThreadFromDatabase(threadId, customerId, leadId, conversationId);
        if (!thread) {
            thread = await this.createNewThread(threadId, customerId, leadId, conversationId);
        }

        this.threads.set(threadId, thread);
        return thread;
    }

    /**
     * Update thread state
     */
    async updateThread(threadId: string, updates: Partial<RenosThread>): Promise<void> {
        const thread = this.threads.get(threadId);
        if (!thread) {
            throw new Error(`Thread ${threadId} not found`);
        }

        const updatedThread = {
            ...thread,
            ...updates,
            updatedAt: new Date(),
        };

        this.threads.set(threadId, updatedThread);
        
        // Persist to database
        await this.persistThreadToDatabase(updatedThread);
    }

    /**
     * Add agent action to thread history
     */
    async addAgentAction(
        threadId: string,
        agentType: AgentAction["agentType"],
        action: string,
        input: Record<string, unknown>,
        output: Record<string, unknown>,
        status: AgentAction["status"],
        duration?: number,
        error?: string
    ): Promise<void> {
        const thread = this.threads.get(threadId);
        if (!thread) {
            throw new Error(`Thread ${threadId} not found`);
        }

        const agentAction: AgentAction = {
            id: nanoid(),
            agentType,
            action,
            input,
            output,
            status,
            timestamp: new Date(),
            duration,
            error,
        };

        thread.agentHistory.push(agentAction);
        
        // Keep only last 100 actions to prevent memory bloat
        if (thread.agentHistory.length > 100) {
            thread.agentHistory = thread.agentHistory.slice(-100);
        }

        await this.updateThread(threadId, { agentHistory: thread.agentHistory });
    }

    /**
     * Get thread context for agent processing
     */
    getThreadContext(threadId: string): RenosThread | null {
        return this.threads.get(threadId) || null;
    }

    /**
     * Get conversation summary for context
     */
    getConversationSummary(threadId: string): string {
        const thread = this.threads.get(threadId);
        if (!thread) {
            return "No thread context available";
        }

        const { businessContext, conversationState, agentHistory } = thread;
        
        let summary = `Thread: ${threadId}\n`;
        summary += `Customer: ${businessContext.customerProfile?.name || "Unknown"}\n`;
        summary += `Current Intent: ${conversationState.currentIntent}\n`;
        summary += `Confidence: ${conversationState.confidence}%\n`;
        
        if (businessContext.currentLead) {
            summary += `Current Lead: ${businessContext.currentLead.taskType} - ${businessContext.currentLead.squareMeters}m²\n`;
        }
        
        summary += `Recent Actions: ${agentHistory.slice(-3).map(a => `${a.agentType}:${a.action}`).join(", ")}\n`;
        
        return summary;
    }

    /**
     * Generate unique thread ID
     */
    private generateThreadId(customerId?: string, leadId?: string, conversationId?: string): string {
        if (conversationId) {
            return `conv_${conversationId}`;
        }
        if (leadId) {
            return `lead_${leadId}`;
        }
        if (customerId) {
            return `customer_${customerId}`;
        }
        return `session_${nanoid(12)}`;
    }

    /**
     * Load thread from database
     */
    private async loadThreadFromDatabase(
        threadId: string,
        customerId?: string,
        leadId?: string,
        conversationId?: string
    ): Promise<RenosThread | null> {
        try {
            // This would be implemented with actual database queries
            // For now, return null to create new thread
            return null;
        } catch (error) {
            logger.error({ error, threadId }, "Failed to load thread from database");
            return null;
        }
    }

    /**
     * Create new thread
     */
    private async createNewThread(
        threadId: string,
        customerId?: string,
        leadId?: string,
        conversationId?: string
    ): Promise<RenosThread> {
        const now = new Date();
        
        const thread: RenosThread = {
            threadId,
            customerId,
            leadId,
            conversationId,
            businessContext: {
                leadHistory: [],
                pricingHistory: [],
                bookingHistory: [],
                escalationLevel: "none",
                preferredCommunicationChannel: "email",
                timezone: "Europe/Copenhagen",
                language: "da",
            },
            conversationState: {
                currentIntent: "unknown",
                confidence: 0,
                pendingActions: [],
                completedActions: [],
                waitingForUserInput: false,
                contextSummary: "New conversation started",
            },
            agentHistory: [],
            createdAt: now,
            updatedAt: now,
        };

        // Load customer profile if customerId provided
        if (customerId) {
            await this.loadCustomerProfile(thread, customerId);
        }

        // Load lead information if leadId provided
        if (leadId) {
            await this.loadLeadInformation(thread, leadId);
        }

        return thread;
    }

    /**
     * Load customer profile into thread
     */
    private async loadCustomerProfile(thread: RenosThread, customerId: string): Promise<void> {
        try {
            const customer = await prisma.customer.findUnique({
                where: { id: customerId },
                include: {
                    leads: true,
                    bookings: true,
                },
            });

            if (customer) {
                thread.businessContext.customerProfile = {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email || undefined,
                    phone: customer.phone || undefined,
                    address: customer.address || undefined,
                    totalLeads: customer.totalLeads,
                    totalBookings: customer.totalBookings,
                    totalRevenue: customer.totalRevenue,
                    averageBookingValue: customer.totalBookings > 0 ? customer.totalRevenue / customer.totalBookings : 0,
                    lastBookingDate: customer.lastContactAt || undefined,
                    tags: customer.tags,
                };

                // Load lead history
                thread.businessContext.leadHistory = customer.leads.map(lead => ({
                    source: lead.source,
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    address: lead.address,
                    squareMeters: lead.squareMeters || undefined,
                    rooms: lead.rooms || undefined,
                    taskType: lead.taskType,
                    preferredDates: lead.preferredDates,
                }));

                // Load booking history
                thread.businessContext.bookingHistory = customer.bookings.map(booking => ({
                    id: booking.id,
                    scheduledAt: booking.scheduledAt,
                    serviceType: booking.serviceType || "Unknown",
                    duration: booking.estimatedDuration,
                    status: booking.status as "scheduled" | "completed" | "cancelled",
                    notes: booking.notes || undefined,
                }));
            }
        } catch (error) {
            logger.error({ error, customerId }, "Failed to load customer profile");
        }
    }

    /**
     * Load lead information into thread
     */
    private async loadLeadInformation(thread: RenosThread, leadId: string): Promise<void> {
        try {
            const lead = await prisma.lead.findUnique({
                where: { id: leadId },
                include: {
                    quotes: true,
                },
            });

            if (lead) {
                thread.businessContext.currentLead = {
                    source: lead.source,
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    address: lead.address,
                    squareMeters: lead.squareMeters || undefined,
                    rooms: lead.rooms || undefined,
                    taskType: lead.taskType,
                    preferredDates: lead.preferredDates,
                };

                // Load pricing history
                thread.businessContext.pricingHistory = lead.quotes.map(quote => ({
                    id: quote.id,
                    serviceType: lead.taskType || "Unknown",
                    estimatedHours: quote.estimatedHours,
                    workers: 2, // Default assumption
                    totalPrice: quote.total,
                    createdAt: quote.createdAt,
                    accuracy: 100, // Would need actual vs estimated comparison
                }));
            }
        } catch (error) {
            logger.error({ error, leadId }, "Failed to load lead information");
        }
    }

    /**
     * Persist thread to database
     */
    private async persistThreadToDatabase(thread: RenosThread): Promise<void> {
        try {
            // This would be implemented with actual database persistence
            // For now, just log the update
            logger.debug({ threadId: thread.threadId }, "Thread state updated");
        } catch (error) {
            logger.error({ error, threadId: thread.threadId }, "Failed to persist thread to database");
        }
    }
}

// Singleton instance
let threadManager: RenosThreadManager | null = null;

/**
 * Get the thread manager instance
 */
export function getThreadManager(): RenosThreadManager {
    if (!threadManager) {
        threadManager = new RenosThreadManager();
    }
    return threadManager;
}