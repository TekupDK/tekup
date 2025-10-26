import cron, { type ScheduledTask } from "node-cron";
import { listRecentMessages } from "./gmailService";
import { isLeadmailEmail, parseLeadEmail, type ParsedLead } from "./leadParser";
import { logger } from "../logger";
import { prisma } from "./databaseService";
import { findOrCreateCustomer, updateCustomerStats } from "./customerService";
// import { getAutoResponseService } from "./emailAutoResponseService"; // DISABLED - not sending auto-emails

/**
 * Storage for processed lead IDs to avoid duplicates
 */
const processedLeadIds = new Set<string>();

/**
 * Storage for parsed leads (in-memory for now)
 */
const leads: ParsedLead[] = [];

/**
 * Save parsed lead to database
 */
async function saveLeadToDatabase(parsedLead: ParsedLead): Promise<string> {
    try {
        // Create or find customer if email exists
        let customerId: string | undefined;
        if (parsedLead.email && parsedLead.name) {
            const customer = await findOrCreateCustomer(parsedLead.email, parsedLead.name);
            customerId = customer.id;
        }

        // Check for duplicate leads - prevent creating multiple leads for same email thread
        // This is especially important for email replies (Re: Re:) which should update existing lead
        if (parsedLead.threadId || (customerId && parsedLead.email)) {
            const existingLead = await prisma.lead.findFirst({
                where: {
                    OR: [
                        // Same email thread - most reliable duplicate check
                        parsedLead.threadId ? { emailThreadId: parsedLead.threadId } : {},
                        // Same customer + similar timing (within 24 hours) - catch thread ID mismatches
                        customerId ? {
                            customerId: customerId,
                            email: parsedLead.email,
                            createdAt: {
                                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                            }
                        } : {}
                    ].filter(clause => Object.keys(clause).length > 0)
                }
            });

            if (existingLead) {
                logger.info(
                    {
                        existingLeadId: existingLead.id,
                        threadId: parsedLead.threadId,
                        email: parsedLead.email
                    },
                    "Duplicate lead detected - skipping creation (likely email thread reply)"
                );
                return existingLead.id;
            }
        }

        // Create lead in database
        const lead = await prisma.lead.create({
            data: {
                customerId,
                source: parsedLead.source,
                name: parsedLead.name,
                email: parsedLead.email,
                phone: parsedLead.phone,
                address: parsedLead.address,
                squareMeters: parsedLead.squareMeters,
                rooms: parsedLead.rooms,
                taskType: parsedLead.taskType,
                preferredDates: parsedLead.preferredDates || [],
                status: "new",
                emailThreadId: parsedLead.threadId,
                createdAt: parsedLead.receivedAt,
            },
        });

        // Update customer statistics
        if (customerId) {
            await updateCustomerStats(customerId);
            logger.debug(
                { customerId, leadId: lead.id },
                "Updated customer stats after lead creation"
            );
        }

        logger.info(
            { leadId: lead.id, customerId, email: parsedLead.email },
            "Lead saved to database"
        );

        return lead.id;
    } catch (error) {
        logger.error(
            { error, parsedLead },
            "Failed to save lead to database"
        );
        throw error;
    }
}

/**
 * Lead notification callback type
 */
export type LeadNotificationCallback = (lead: ParsedLead) => void | Promise<void>;

/**
 * Registered notification callbacks
 */
const notificationCallbacks: LeadNotificationCallback[] = [];

/**
 * Get all stored leads
 */
export function getLeads(): readonly ParsedLead[] {
    return [...leads];
}

/**
 * Get leads filtered by criteria
 */
export function getLeadsBySource(source: string): ParsedLead[] {
    return leads.filter((lead) => lead.source === source);
}

/**
 * Get unprocessed leads (for manual review)
 */
export function getRecentLeads(count: number = 10): ParsedLead[] {
    return leads.slice(-count);
}

/**
 * Check for new Leadmail.no emails and process them
 */
export async function checkForNewLeads(): Promise<ParsedLead[]> {
    try {
        logger.debug("Checking for new Leadmail.no emails...");

        // Fetch recent emails (last 10)
        const messages = await listRecentMessages({ maxResults: 10 });
        if (!messages || messages.length === 0) {
            logger.debug("No recent messages found");
            return [];
        }

        const newLeads: ParsedLead[] = [];

        for (const message of messages) {
            // Skip if already processed
            if (processedLeadIds.has(message.id)) {
                continue;
            }

            // Check if it's a Leadmail.no email
            if (!isLeadmailEmail(message)) {
                processedLeadIds.add(message.id);
                continue;
            }

            // Parse the lead
            const lead = parseLeadEmail(message);
            if (!lead) {
                logger.warn(
                    { emailId: message.id },
                    "Failed to parse Leadmail.no email"
                );
                processedLeadIds.add(message.id);
                continue;
            }

            // Store the lead in memory
            leads.push(lead);
            processedLeadIds.add(message.id);
            newLeads.push(lead);

            // Save lead to database
            try {
                await saveLeadToDatabase(lead);
                logger.info(
                    {
                        emailId: lead.emailId,
                        name: lead.name,
                        source: lead.source,
                        taskType: lead.taskType,
                    },
                    "New lead detected, stored in memory and database"
                );
            } catch (dbError) {
                logger.error(
                    { error: dbError, leadId: lead.emailId },
                    "Failed to save lead to database, continuing with memory storage"
                );
            }

            // Notify registered callbacks
            for (const callback of notificationCallbacks) {
                try {
                    await callback(lead);
                } catch (err) {
                    logger.error(
                        { err, leadId: lead.emailId },
                        "Lead notification callback failed"
                    );
                }
            }

            // Auto-send email response (AI auto-response) - CHECK ENV FLAG
            // ⚠️ SAFETY: Only enable if AUTO_RESPONSE_ENABLED=true in environment
            // NOTE: Email template quality issues have been FIXED (business hours, placeholders, pricing)
            // But auto-response remains disabled by default for safety

            // Uncomment block below only if you've:
            // 1. Set AUTO_RESPONSE_ENABLED=true in .env
            // 2. Tested emails thoroughly in dry-run mode
            // 3. Verified quality with real customer scenarios

            /* DISABLED - Enable with caution after thorough testing
            import { isAutoResponseEnabled } from "../config";
            
            if (isAutoResponseEnabled()) {
                try {
                    const autoResponseService = getAutoResponseService({
                        enabled: true,
                        requireApproval: true, // Still require manual approval
                        responseDelay: 30,
                        maxResponsesPerDay: 50
                    });

                    await autoResponseService.processLead(lead);
                    logger.info(
                        { leadId: lead.emailId, email: lead.email },
                        "AI auto-response sent to lead"
                    );
                } catch (autoResponseError) {
                    logger.error(
                        { error: autoResponseError, leadId: lead.emailId },
                        "Failed to send AI auto-response"
                    );
                }
            } else {
                logger.info(
                    { leadId: lead.emailId },
                    "Auto-response disabled by AUTO_RESPONSE_ENABLED env flag"
                );
            }
            */
            logger.info(
                { leadId: lead.emailId, email: lead.email },
                "Auto-response SKIPPED (disabled until email format is improved)"
            );
        }

        if (newLeads.length > 0) {
            logger.info(
                { count: newLeads.length },
                "Finished processing new leads"
            );
        }

        return newLeads;
    } catch (err) {
        logger.error({ err }, "Error checking for new leads");
        return [];
    }
}

/**
 * Start the lead monitoring service with a cron schedule
 * @param schedule - Cron schedule (default: every 20 minutes)
 */
export function startLeadMonitoring(
    schedule: string = "*/20 * * * *"
): ScheduledTask {
    logger.info({ schedule }, "Starting lead monitoring service");

    // Do an initial check immediately
    checkForNewLeads().catch((err) => {
        logger.error({ err }, "Initial lead check failed");
    });

    // Schedule periodic checks
    const task = cron.schedule(schedule, () => {
        checkForNewLeads().catch((err) => {
            logger.error({ err }, "Scheduled lead check failed");
        });
    });

    logger.info("Lead monitoring service started successfully");
    return task;
}

/**
 * Stop the lead monitoring service
 */
export function stopLeadMonitoring(task: ScheduledTask): void {
    task.stop();
    logger.info("Lead monitoring service stopped");
}

/**
 * Get monitoring statistics
 */
export function getMonitoringStats(): {
    totalLeads: number;
    processedEmailIds: number;
    callbacksRegistered: number;
} {
    return {
        totalLeads: leads.length,
        processedEmailIds: processedLeadIds.size,
        callbacksRegistered: notificationCallbacks.length,
    };
}

// Start monitoring in background
void startLeadMonitoring();
