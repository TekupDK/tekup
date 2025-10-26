/**
 * Gmail Label Management Service
 * 
 * Handles automatic labeling of emails based on lead status.
 * Integrates with Gmail API to create, apply, and manage labels.
 * 
 * WORKFLOW:
 * new_lead → quote_sent → awaiting_response → booked → completed
 * 
 * Each lead thread should have exactly ONE status label at a time.
 */

import { gmail_v1 } from "googleapis";
import { logger } from "../logger";
import { getGoogleAuthClient } from "./googleAuth";
import { appConfig } from "../config";
import { prisma } from "./databaseService";

/**
 * Validate Gmail thread ID format
 * Rejects test IDs and invalid formats
 */
function isValidThreadId(id: string | undefined): boolean {
    if (!id) return false;
    if (id.startsWith("test_")) return false; // Skip test IDs
    return /^[A-Za-z0-9_-]+$/.test(id);
}
import type {
    LeadStatusLabel,
} from "../types/labels";
import {
    isValidTransition,
    getLabelConfig,
    getAllLabels,
} from "../types/labels";

const scopes = ["https://www.googleapis.com/auth/gmail.modify"];

/**
 * Label operation result
 */
export interface LabelOperationResult {
    success: boolean;
    labelId?: string;
    labelName?: string;
    threadId?: string;
    error?: string;
}

/**
 * Thread label status
 */
export interface ThreadLabelStatus {
    threadId: string;
    currentLabel?: LeadStatusLabel;
    allLabels: string[];
    hasMultipleStatusLabels: boolean; // Should be false (only one status label per thread)
}

/**
 * Create Gmail client
 */
function createGmailClient(): gmail_v1.Gmail | null {
    try {
        const auth = getGoogleAuthClient(scopes);
        if (!auth) {
            logger.error("Failed to get Google auth client for Gmail");
            return null;
        }

        return new gmail_v1.Gmail({ auth });
    } catch (error) {
        logger.error({ error }, "Error creating Gmail client");
        return null;
    }
}

/**
 * Ensure all RenOS labels exist in Gmail
 * Creates labels if they don't exist
 * 
 * @returns Map of label names to Gmail label IDs
 */
export async function ensureLabelsExist(): Promise<Map<LeadStatusLabel, string>> {
    const gmail = createGmailClient();
    if (!gmail) {
        throw new Error("Failed to create Gmail client");
    }

    const userId = appConfig.google.GOOGLE_IMPERSONATED_USER || "me";
    const labelMap = new Map<LeadStatusLabel, string>();

    logger.info("Ensuring all RenOS labels exist in Gmail...");

    // Get existing labels
    const existingLabelsResponse = await gmail.users.labels.list({ userId });
    const existingLabels = existingLabelsResponse.data.labels || [];

    // Check each required label
    for (const labelName of getAllLabels()) {
        const config = getLabelConfig(labelName);
        const displayName = config.displayName;

        // Check if label exists
        const existing = existingLabels.find((l) => l.name === displayName);

        if (existing && existing.id) {
            logger.debug({ labelName, labelId: existing.id }, "Label already exists");
            labelMap.set(labelName, existing.id);
        } else {
            // Create label
            // Normalize label name to avoid encoding issues (mojibake)
            const cleanName = displayName.normalize("NFC").replace(/[^\p{L}\p{N}_ -]/gu, "");
            logger.info({ labelName, displayName: cleanName }, "Creating new Gmail label");

            const createResponse = await gmail.users.labels.create({
                userId,
                requestBody: {
                    name: cleanName,
                    labelListVisibility: "labelShow",
                    messageListVisibility: "show",
                    // Note: color omitted - Gmail rejects custom colors not on allowed palette
                },
            });

            if (createResponse.data.id) {
                logger.info(
                    { labelName, labelId: createResponse.data.id },
                    "✅ Label created successfully"
                );
                labelMap.set(labelName, createResponse.data.id);
            } else {
                logger.error({ labelName }, "Failed to create label");
            }
        }
    }

    logger.info(
        { totalLabels: labelMap.size },
        "✅ All RenOS labels verified/created"
    );

    return labelMap;
}

/**
 * Get Gmail label ID for a status label
 * 
 * @param statusLabel - Status label name
 * @returns Gmail label ID or null if not found
 */
export async function getGmailLabelId(statusLabel: LeadStatusLabel): Promise<string | null> {
    const gmail = createGmailClient();
    if (!gmail) {
        return null;
    }

    const userId = appConfig.google.GOOGLE_IMPERSONATED_USER || "me";
    const config = getLabelConfig(statusLabel);
    const displayName = config.displayName;

    try {
        const response = await gmail.users.labels.list({ userId });
        const labels = response.data.labels || [];

        const label = labels.find((l) => l.name === displayName);
        return label?.id || null;
    } catch (error) {
        logger.error({ error, statusLabel }, "Error getting Gmail label ID");
        return null;
    }
}

/**
 * Apply a status label to an email thread
 * Automatically removes other status labels (only one status per thread)
 * 
 * @param threadId - Gmail thread ID
 * @param newLabel - Status label to apply
 * @param reason - Reason for label change (for logging)
 * @returns Operation result
 */
export async function applyLabelToThread(
    threadId: string,
    newLabel: LeadStatusLabel,
    reason?: string
): Promise<LabelOperationResult> {
    // Validate thread ID format
    if (!isValidThreadId(threadId)) {
        logger.warn(
            { threadId, newLabel },
            "⚠️ Invalid or test thread ID - skipping label application"
        );
        return { success: false, error: "Invalid thread ID" };
    }

    const gmail = createGmailClient();
    if (!gmail) {
        return { success: false, error: "Failed to create Gmail client" };
    }

    const userId = appConfig.google.GOOGLE_IMPERSONATED_USER || "me";

    try {
        logger.info(
            { threadId, newLabel, reason },
            "🏷️ Applying label to thread"
        );

        // Get current thread status
        const currentStatus = await getThreadLabelStatus(threadId);

        // Validate state transition
        if (currentStatus.currentLabel) {
            if (!isValidTransition(currentStatus.currentLabel, newLabel)) {
                logger.warn(
                    {
                        threadId,
                        from: currentStatus.currentLabel,
                        to: newLabel,
                    },
                    "⚠️ Invalid state transition - allowing anyway"
                );
            }
        }

        // Get label map
        const labelMap = await ensureLabelsExist();
        const newLabelId = labelMap.get(newLabel);

        if (!newLabelId) {
            return {
                success: false,
                error: `Label ID not found for ${newLabel}`,
            };
        }

        // Remove all other status labels (only one status per thread)
        const removeLabels: string[] = [];
        for (const [otherLabel, labelId] of labelMap.entries()) {
            if (otherLabel !== newLabel && currentStatus.allLabels.includes(labelId)) {
                removeLabels.push(labelId);
            }
        }

        // Apply new label and remove old ones
        await gmail.users.threads.modify({
            userId,
            id: threadId,
            requestBody: {
                addLabelIds: [newLabelId],
                removeLabelIds: removeLabels,
            },
        });

        // Update database lead status
        await updateLeadStatusInDatabase(threadId, newLabel);

        logger.info(
            {
                threadId,
                newLabel,
                addedLabel: newLabelId,
                removedLabels: removeLabels,
            },
            "✅ Label applied successfully"
        );

        return {
            success: true,
            labelId: newLabelId,
            labelName: newLabel,
            threadId,
        };
    } catch (error) {
        logger.error(
            { error, threadId, newLabel },
            "❌ Error applying label to thread"
        );
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Get current label status for a thread
 * 
 * @param threadId - Gmail thread ID
 * @returns Thread label status
 */
export async function getThreadLabelStatus(threadId: string): Promise<ThreadLabelStatus> {
    // Validate thread ID format
    if (!isValidThreadId(threadId)) {
        logger.debug({ threadId }, "Skipping label status check for invalid/test thread ID");
        return {
            threadId,
            allLabels: [],
            hasMultipleStatusLabels: false,
        };
    }

    const gmail = createGmailClient();
    if (!gmail) {
        return {
            threadId,
            allLabels: [],
            hasMultipleStatusLabels: false,
        };
    }

    const userId = appConfig.google.GOOGLE_IMPERSONATED_USER || "me";

    try {
        // Get thread details
        const response = await gmail.users.threads.get({
            userId,
            id: threadId,
            format: "minimal",
        });

        const messages = response.data.messages || [];
        const allLabels: string[] = [];

        // Collect all labels from all messages in thread
        for (const message of messages) {
            if (message.labelIds) {
                allLabels.push(...message.labelIds);
            }
        }

        // Get unique labels
        const uniqueLabels = Array.from(new Set(allLabels));

        // Get label map to check for status labels
        const labelMap = await ensureLabelsExist();
        const statusLabelIds = Array.from(labelMap.values());

        // Find which status labels are present
        const presentStatusLabels = uniqueLabels.filter((labelId) =>
            statusLabelIds.includes(labelId)
        );

        // Get current status label (should be only one)
        let currentLabel: LeadStatusLabel | undefined;

        for (const [labelName, labelId] of labelMap.entries()) {
            if (presentStatusLabels.includes(labelId)) {
                currentLabel = labelName;
                break;
            }
        }

        return {
            threadId,
            currentLabel,
            allLabels: uniqueLabels,
            hasMultipleStatusLabels: presentStatusLabels.length > 1,
        };
    } catch (error) {
        logger.error({ error, threadId }, "Error getting thread label status");
        return {
            threadId,
            allLabels: [],
            hasMultipleStatusLabels: false,
        };
    }
}

/**
 * Update lead status in database
 * 
 * @param threadId - Gmail thread ID
 * @param status - New status
 */
async function updateLeadStatusInDatabase(
    threadId: string,
    status: LeadStatusLabel
): Promise<void> {
    try {
        // Find lead by thread ID
        const lead = await prisma.lead.findFirst({
            where: { emailThreadId: threadId },
        });

        if (lead) {
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    status: status.replace("_", "-"), // Convert to kebab-case for DB
                    updatedAt: new Date(),
                },
            });

            logger.debug(
                { leadId: lead.id, threadId, status },
                "Updated lead status in database"
            );
        } else {
            logger.warn(
                { threadId, status },
                "Lead not found in database for thread"
            );
        }
    } catch (error) {
        logger.error(
            { error, threadId, status },
            "Error updating lead status in database"
        );
    }
}

/**
 * Get all threads with a specific label
 * 
 * @param statusLabel - Status label to search for
 * @param maxResults - Maximum number of threads to return
 * @returns Array of thread IDs
 */
export async function getThreadsByLabel(
    statusLabel: LeadStatusLabel,
    maxResults: number = 100
): Promise<string[]> {
    const gmail = createGmailClient();
    if (!gmail) {
        return [];
    }

    const userId = appConfig.google.GOOGLE_IMPERSONATED_USER || "me";

    try {
        // Get label ID
        const labelId = await getGmailLabelId(statusLabel);
        if (!labelId) {
            logger.warn({ statusLabel }, "Label ID not found");
            return [];
        }

        // Search for threads with this label
        const response = await gmail.users.threads.list({
            userId,
            labelIds: [labelId],
            maxResults,
        });

        const threads = response.data.threads || [];
        return threads.map((t) => t.id).filter((id): id is string => id !== null && id !== undefined);
    } catch (error) {
        logger.error({ error, statusLabel }, "Error getting threads by label");
        return [];
    }
}

/**
 * Sync labels between Gmail and database
 * Useful for ensuring consistency
 */
export async function syncLabelsWithDatabase(): Promise<void> {
    logger.info("Starting label sync between Gmail and database...");

    try {
        // Get all leads from database
        const leads = await prisma.lead.findMany({
            where: {
                emailThreadId: { not: null },
            },
            select: {
                id: true,
                emailThreadId: true,
                status: true,
            },
        });

        logger.info({ totalLeads: leads.length }, "Syncing labels for leads");

        let syncedCount = 0;
        let errorCount = 0;

        for (const lead of leads) {
            if (!lead.emailThreadId) continue;

            try {
                // Get current Gmail labels
                const labelStatus = await getThreadLabelStatus(lead.emailThreadId);

                // Convert DB status to label format
                const dbStatus = (lead.status?.replace("-", "_") as LeadStatusLabel) || "new_lead";

                // If labels don't match, update Gmail
                if (labelStatus.currentLabel !== dbStatus) {
                    logger.info(
                        {
                            leadId: lead.id,
                            threadId: lead.emailThreadId,
                            dbStatus,
                            gmailStatus: labelStatus.currentLabel,
                        },
                        "Syncing label mismatch"
                    );

                    await applyLabelToThread(
                        lead.emailThreadId,
                        dbStatus,
                        "Database sync"
                    );

                    syncedCount++;
                }
            } catch (error) {
                logger.error(
                    { error, leadId: lead.id, threadId: lead.emailThreadId },
                    "Error syncing label for lead"
                );
                errorCount++;
            }
        }

        logger.info(
            { totalLeads: leads.length, syncedCount, errorCount },
            "✅ Label sync complete"
        );
    } catch (error) {
        logger.error({ error }, "Error syncing labels with database");
        throw error;
    }
}
