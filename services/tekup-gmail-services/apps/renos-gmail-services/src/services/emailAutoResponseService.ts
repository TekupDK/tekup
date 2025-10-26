import type { ParsedLead } from "./leadParser";
import {
    EmailResponseGenerator,
    type GeneratedEmailResponse,
} from "./emailResponseGenerator";
import { getLLMProvider } from "../llm/providerFactory";
import { sendGenericEmail } from "./gmailService";
import { logger } from "../logger";
import { prisma } from "./databaseService";
import { updateCustomerStats } from "./customerService";
import {
    getLeadSourceRule,
    extractCustomerEmail,
    validateCustomerEmail,
    formatLeadSourceRule,
    type LeadSourceRule,
} from "../config/leadSourceRules";

/**
 * Auto-response configuration
 */
export interface AutoResponseConfig {
    enabled: boolean;
    requireApproval: boolean;
    responseDelay: number; // seconds to wait before responding
    maxResponsesPerDay: number;
}

/**
 * Response status tracking
 */
export interface ResponseStatus {
    leadId: string;
    leadName: string;
    status: "pending" | "sent" | "approved" | "rejected" | "failed";
    generatedAt: Date;
    sentAt?: Date;
    error?: string;
}

/**
 * Email auto-response service
 */
export class EmailAutoResponseService {
    private generator: EmailResponseGenerator;
    private config: AutoResponseConfig;
    private responsesSentToday: number = 0;
    private lastResetDate: Date = new Date();
    private pendingResponses: Map<string, GeneratedEmailResponse> = new Map();
    private responseStatuses: Map<string, ResponseStatus> = new Map();

    constructor(config?: Partial<AutoResponseConfig>) {
        // Uses configured LLM provider (LLM_PROVIDER env var: openai/gemini/ollama)
        const llmProvider = getLLMProvider();
        this.generator = new EmailResponseGenerator(llmProvider ?? undefined);
        this.config = {
            enabled: config?.enabled ?? false, // ❌ AUTO-RESPONSE DISABLED
            requireApproval: config?.requireApproval ?? true, // ✅ KRÆV GODKENDELSE
            responseDelay: config?.responseDelay ?? 30, // 30 seconds default
            maxResponsesPerDay: config?.maxResponsesPerDay ?? 50,
        };
    }

    /**
     * Process a new lead and generate/send auto-response
     */
    async processLead(lead: ParsedLead): Promise<ResponseStatus> {
        logger.info(
            {
                leadId: lead.emailId,
                name: lead.name,
                source: lead.source,
            },
            "Processing lead for auto-response"
        );

        // Check if service is enabled
        if (!this.config.enabled) {
            logger.info("Auto-response is disabled");
            return this.createStatus(lead, "rejected", "Auto-response disabled");
        }

        // Check if lead has email
        if (!lead.email) {
            logger.warn({ leadId: lead.emailId }, "Lead has no email address");
            return this.createStatus(lead, "failed", "No email address");
        }

        // Check daily limit
        this.resetDailyCountIfNeeded();
        if (this.responsesSentToday >= this.config.maxResponsesPerDay) {
            logger.warn(
                { limit: this.config.maxResponsesPerDay },
                "Daily response limit reached"
            );
            return this.createStatus(lead, "rejected", "Daily limit reached");
        }

        try {
            // Generate response
            const response = await this.generateResponseForLead(lead);

            // Store status
            const status = this.createStatus(lead, "pending");
            this.responseStatuses.set(lead.emailId, status);

            if (this.config.requireApproval) {
                // Store for manual approval
                this.pendingResponses.set(lead.emailId, response);
                logger.info(
                    { leadId: lead.emailId },
                    "Response generated, awaiting approval"
                );
                status.status = "approved"; // Will be changed to "approved" or "rejected"
                return status;
            } else {
                // Send automatically after delay
                if (this.config.responseDelay > 0) {
                    logger.info(
                        { delay: this.config.responseDelay },
                        "Delaying response"
                    );
                    await this.delay(this.config.responseDelay * 1000);
                }

                await this.sendResponse(lead.emailId, response);
                status.status = "sent";
                status.sentAt = new Date();
                this.responsesSentToday++;

                logger.info(
                    { leadId: lead.emailId, to: response.to },
                    "Auto-response sent successfully"
                );

                return status;
            }
        } catch (err) {
            logger.error(
                { err, leadId: lead.emailId },
                "Failed to process lead for auto-response"
            );
            return this.createStatus(lead, "failed", (err as Error).message);
        }
    }

    /**
     * Generate email response for a lead
     * 
     * KRITISK: Includes duplicate detection check AND lead source routing
     */
    private async generateResponseForLead(
        lead: ParsedLead
    ): Promise<GeneratedEmailResponse> {
        // Determine response type based on task type
        let template: "moving" | "regular" | "quote-request" = "quote-request";

        if (
            lead.taskType?.toLowerCase().includes("flytte") ||
            lead.taskType?.toLowerCase().includes("flytterengøring")
        ) {
            template = "moving";
        } else if (
            lead.taskType?.toLowerCase().includes("fast") ||
            lead.taskType?.toLowerCase().includes("ugentlig")
        ) {
            template = "regular";
        }

        // This will automatically check for duplicates
        let response = await this.generator.generateQuickResponse(lead, template);

        // Log duplicate check results if present
        if (response.duplicateCheck) {
            logger.info(
                {
                    leadId: lead.emailId,
                    action: response.duplicateCheck.action,
                    shouldSend: response.shouldSend,
                    warnings: response.warnings,
                },
                "Duplicate check completed"
            );
        }

        // 🚨 KRITISK: Apply lead source routing rules
        response = this.applyLeadSourceRouting(lead, response);

        return response;
    }

    /**
     * Apply lead source routing rules
     * 
     * KRITISK REGEL fra MEMORY_4, MEMORY_16:
     * Different lead sources require different email handling
     * 
     * @param lead - Parsed lead
     * @param response - Generated email response
     * @returns Modified response with correct routing
     */
    private applyLeadSourceRouting(
        lead: ParsedLead,
        response: GeneratedEmailResponse
    ): GeneratedEmailResponse {
        // Determine lead source from original email
        // Lead should have 'from' field indicating where it came from
        const leadWithMeta = lead as unknown as { from?: string; subject?: string; bodyText?: string; body?: string };
        const originalFrom = leadWithMeta.from || lead.email || "";
        const originalSubject = leadWithMeta.subject || "";

        const sourceRule: LeadSourceRule = getLeadSourceRule(originalFrom, originalSubject);

        logger.info(
            {
                leadId: lead.emailId,
                source: sourceRule.source,
                action: sourceRule.action,
                canReplyDirect: sourceRule.canReplyDirect,
            },
            "📌 Lead source rule determined"
        );

        // If unknown source, log full rule for review
        if (sourceRule.source === "unknown") {
            logger.warn(
                {
                    leadId: lead.emailId,
                    from: originalFrom,
                    subject: originalSubject,
                },
                "⚠️ Unknown lead source detected - manual review recommended"
            );
        }

        // Apply routing logic
        if (sourceRule.action === "CREATE_NEW_EMAIL") {
            // Must extract customer email and create new thread
            const leadWithMeta = lead as unknown as { bodyText?: string; body?: string };
            const bodyText = leadWithMeta.bodyText || leadWithMeta.body || "";
            const customerEmail = extractCustomerEmail(bodyText);

            const validation = validateCustomerEmail(sourceRule, customerEmail);

            if (!validation.valid) {
                logger.error(
                    {
                        leadId: lead.emailId,
                        source: sourceRule.source,
                        error: validation.error,
                    },
                    "🚫 Cannot create new email - customer email validation failed"
                );

                // Add error to warnings
                const warnings = response.warnings || [];
                warnings.push(`🚫 ${validation.error}`);
                warnings.push(formatLeadSourceRule(sourceRule));

                return {
                    ...response,
                    shouldSend: false,
                    warnings,
                };
            }

            logger.info(
                {
                    leadId: lead.emailId,
                    customerEmail,
                    source: sourceRule.source,
                },
                "✅ Creating new email to customer (not replying to lead source)"
            );

            // Change 'to' address to customer email
            // Remove replyToThreadId to create new thread
            return {
                ...response,
                to: customerEmail,
                replyToThreadId: undefined, // NEW thread
                subject: response.subject || `Tilbud på ${lead.taskType || "rengøring"}`,
            };
        } else if (sourceRule.action === "REPLY_WITH_WARNING") {
            // Add warning but proceed
            const warnings = response.warnings || [];
            warnings.push(`⚠️ Unknown lead source - verify manually`);
            warnings.push(formatLeadSourceRule(sourceRule));

            return {
                ...response,
                warnings,
            };
        }

        // REPLY_NORMALLY - no changes needed
        return response;
    }

    /**
     * Send an email response
     * 
     * KRITISK: Checks duplicate detection before sending
     */
    private async sendResponse(
        leadId: string,
        response: GeneratedEmailResponse
    ): Promise<void> {
        // ⚠️ KRITISK: Check if email should actually be sent
        if (response.shouldSend === false) {
            logger.error(
                {
                    leadId,
                    to: response.to,
                    warnings: response.warnings,
                    duplicateCheck: response.duplicateCheck,
                },
                "🚫 BLOCKED: Email NOT sent due to duplicate detection"
            );
            throw new Error(
                `Email blocked: ${response.warnings?.join(", ") || "Duplicate detected"}`
            );
        }

        // Log warnings if present (but still send)
        if (response.warnings && response.warnings.length > 0) {
            logger.warn(
                {
                    leadId,
                    to: response.to,
                    warnings: response.warnings,
                },
                "⚠️ Sending email with warnings - manual review recommended"
            );
        }

        await sendGenericEmail({
            to: response.to,
            subject: response.subject,
            body: response.body,
            threadId: response.replyToThreadId,
        });
    }

    /**
     * Approve a pending response and send it
     */
    async approvePendingResponse(leadId: string): Promise<boolean> {
        const response = this.pendingResponses.get(leadId);
        const status = this.responseStatuses.get(leadId);

        if (!response || !status) {
            logger.warn({ leadId }, "No pending response found");
            return false;
        }

        try {
            await this.sendResponse(leadId, response);
            status.status = "sent";
            status.sentAt = new Date();
            this.responsesSentToday++;
            this.pendingResponses.delete(leadId);

            logger.info({ leadId }, "Pending response approved and sent");
            return true;
        } catch (err) {
            logger.error({ err, leadId }, "Failed to send approved response");
            status.status = "failed";
            status.error = (err as Error).message;
            return false;
        }
    }

    /**
     * Reject a pending response
     */
    async rejectPendingResponse(leadId: string): Promise<boolean> {
        const status = this.responseStatuses.get(leadId);

        if (!status) {
            logger.warn({ leadId }, "No pending response found");
            return false;
        }

        status.status = "rejected";
        this.pendingResponses.delete(leadId);

        logger.info({ leadId }, "Pending response rejected");

        // Add await to make this properly async
        await Promise.resolve();

        return true;
    }

    /**
     * Get all pending responses
     */
    getPendingResponses(): Array<{
        leadId: string;
        response: GeneratedEmailResponse;
        status: ResponseStatus;
    }> {
        const pending: Array<{
            leadId: string;
            response: GeneratedEmailResponse;
            status: ResponseStatus;
        }> = [];

        for (const [leadId, response] of this.pendingResponses.entries()) {
            const status = this.responseStatuses.get(leadId);
            if (status) {
                pending.push({ leadId, response, status });
            }
        }

        return pending;
    }

    /**
     * Get response status for a lead
     */
    getResponseStatus(leadId: string): ResponseStatus | undefined {
        return this.responseStatuses.get(leadId);
    }

    /**
     * Get all response statuses
     */
    getAllResponseStatuses(): ResponseStatus[] {
        return Array.from(this.responseStatuses.values());
    }

    /**
     * Get service statistics
     */
    getStatistics() {
        const statuses = Array.from(this.responseStatuses.values());
        return {
            totalResponses: statuses.length,
            sent: statuses.filter((s) => s.status === "sent").length,
            pending: statuses.filter((s) => s.status === "pending").length,
            failed: statuses.filter((s) => s.status === "failed").length,
            approved: statuses.filter((s) => s.status === "approved").length,
            rejected: statuses.filter((s) => s.status === "rejected").length,
            todayCount: this.responsesSentToday,
            dailyLimit: this.config.maxResponsesPerDay,
            enabled: this.config.enabled,
            requireApproval: this.config.requireApproval,
        };
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<AutoResponseConfig>): void {
        this.config = { ...this.config, ...config };
        logger.info({ config: this.config }, "Auto-response config updated");
    }

    /**
     * Create a response status object
     */
    private createStatus(
        lead: ParsedLead,
        status: ResponseStatus["status"],
        error?: string
    ): ResponseStatus {
        return {
            leadId: lead.emailId,
            leadName: lead.name || "Unknown",
            status,
            generatedAt: new Date(),
            error,
        };
    }

    /**
     * Reset daily counter if it's a new day
     */
    private resetDailyCountIfNeeded(): void {
        const now = new Date();
        if (now.getDate() !== this.lastResetDate.getDate()) {
            this.responsesSentToday = 0;
            this.lastResetDate = now;
            logger.info("Daily response counter reset");
        }
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Create a pending email response in the database
     */
    async createPendingResponse(lead: ParsedLead): Promise<string> {
        logger.info(
            {
                leadId: lead.emailId,
                name: lead.name,
                email: lead.email,
            },
            "Creating pending email response"
        );

        try {
            // First, create or find the lead in the database
            let dbLead = await prisma.lead.findFirst({
                where: {
                    OR: [
                        { id: lead.emailId },
                        { emailThreadId: lead.threadId }
                    ]
                }
            });

            if (!dbLead) {
                // Create the lead in database first
                dbLead = await prisma.lead.create({
                    data: {
                        source: lead.source,
                        name: lead.name,
                        email: lead.email,
                        phone: lead.phone,
                        address: lead.address,
                        squareMeters: lead.squareMeters ?? null,
                        taskType: lead.taskType,
                        status: "new",
                        emailThreadId: lead.threadId,
                    },
                });

                // Update customer statistics if lead is linked to customer
                if (dbLead.customerId) {
                    await updateCustomerStats(dbLead.customerId);
                    logger.debug(
                        { customerId: dbLead.customerId, leadId: dbLead.id },
                        "Updated customer stats after lead creation"
                    );
                }

                logger.info(
                    { leadId: dbLead.id, name: lead.name },
                    "Lead created in database for pending email"
                );
            }

            // Generate the email content
            const response = await this.generateResponseForLead(lead);

            // Create database record with pending status
            const emailResponse = await prisma.emailResponse.create({
                data: {
                    leadId: dbLead.id,
                    recipientEmail: lead.email || "",
                    subject: response.subject,
                    body: response.body,
                    status: "pending",
                    gmailThreadId: response.replyToThreadId,
                    aiModel: "gemini-2.0-flash-exp",
                },
            });

            logger.info(
                {
                    emailResponseId: emailResponse.id,
                    leadId: dbLead.id,
                    subject: response.subject,
                },
                "Pending email response created in database"
            );

            return emailResponse.id;
        } catch (err) {
            logger.error(
                { err, leadId: lead.emailId },
                "Failed to create pending email response"
            );
            throw err;
        }
    }
}

// Singleton instance
let autoResponseService: EmailAutoResponseService | null = null;

/**
 * Get the auto-response service instance
 */
export function getAutoResponseService(
    config?: Partial<AutoResponseConfig>
): EmailAutoResponseService {
    if (!autoResponseService) {
        autoResponseService = new EmailAutoResponseService(config);
    }
    return autoResponseService;
}
