import { google, gmail_v1 } from "googleapis";
import { getGoogleAuthClient } from "./googleAuth";
import { logger } from "../logger";
import { cache, CacheTTL } from "./cacheService";

const gmailScopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify"
];

/**
 * Gmail Label Service
 * Handles all label operations for RenOS email management
 */

interface LabelCache {
    id: string;
    name: string;
}

// In-memory label cache
const labelCache = new Map<string, LabelCache>();

/**
 * Validate Gmail thread/message ID format
 * Rejects test IDs and invalid formats
 */
function isValidGmailId(id: string | undefined): boolean {
    if (!id) return false;
    if (id.startsWith("test_")) return false; // Skip test IDs
    return /^[A-Za-z0-9_-]+$/.test(id);
}

function createGmailClient(): gmail_v1.Gmail | null {
    const auth = getGoogleAuthClient(gmailScopes);
    if (!auth) {
        return null;
    }
    return google.gmail({ version: "v1", auth });
}

/**
 * Standard RenOS labels that should exist
 */
export const STANDARD_LABELS = [
    "Leads",
    "Needs Reply",
    "Venter på svar",
    "I kalender",
    "Finance",
    "Afsluttet",
    "Fast Rengøring",
    "Flytterengøring",
    "Engangsopgaver",
    "Hovedrengøring",
    "Rengøring.nu",
    "Rengøring Århus",
    "AdHelp",
] as const;

export type StandardLabel = typeof STANDARD_LABELS[number];

/**
 * Ensure all standard labels exist in Gmail
 */
export async function ensureStandardLabels(): Promise<void> {
    logger.info("Ensuring all standard RenOS labels exist...");

    for (const labelName of STANDARD_LABELS) {
        try {
            await getOrCreateLabel(labelName);
            logger.debug({ labelName }, "Standard label verified");
        } catch (error) {
            logger.error({ labelName, error }, "Failed to create standard label");
        }
    }

    logger.info("All standard labels verified");
}

/**
 * Get label ID by name, create if doesn't exist
 */
export async function getOrCreateLabel(labelName: string): Promise<string> {
    // Check cache first
    if (labelCache.has(labelName)) {
        return labelCache.get(labelName).id;
    }

    const gmail = createGmailClient();
    if (!gmail) {
        throw new Error("Gmail client not initialized");
    }

    // List all labels
    const response = await gmail.users.labels.list({
        userId: "me",
    });

    // Find existing label
    const existingLabel = response.data.labels?.find(
        (label) => label.name === labelName
    );

    if (existingLabel?.id) {
        // Cache and return
        labelCache.set(labelName, { id: existingLabel.id, name: labelName });
        logger.debug({ labelName, labelId: existingLabel.id }, "Found existing label");
        return existingLabel.id;
    }

    // Create new label
    // Normalize label name to avoid encoding issues (mojibake)
    const cleanName = labelName.normalize("NFC").replace(/[^\p{L}\p{N}_ -]/gu, "");
    logger.info({ labelName: cleanName }, "Creating new label");
    const createResponse = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
            name: cleanName,
            labelListVisibility: "labelShow",
            messageListVisibility: "show",
            // Note: color omitted - Gmail rejects custom colors not on allowed palette
        },
    });

    const labelId = createResponse.data.id;
    labelCache.set(labelName, { id: labelId, name: labelName });
    logger.info({ labelName, labelId }, "Label created successfully");

    return labelId;
}

/**
 * List all Gmail labels
 */
export async function listLabels(): Promise<gmail_v1.Schema$Label[]> {
    const cacheKey = "gmail:labels:all";
    const cached = cache.get<gmail_v1.Schema$Label[]>(cacheKey);
    if (cached) {
        return cached;
    }

    const gmail = createGmailClient();
    if (!gmail) {
        logger.debug("Skipping label list (dry-run)");
        return [];
    }

    const response = await gmail.users.labels.list({
        userId: "me",
    });

    const labels = response.data.labels ?? [];
    cache.set(cacheKey, labels, CacheTTL.medium);

    return labels;
}

/**
 * Add label(s) to a message
 */
export async function addLabelsToMessage(
    messageId: string,
    labelNames: string | string[]
): Promise<void> {
    // Validate message ID format
    if (!isValidGmailId(messageId)) {
        logger.debug({ messageId }, "Skipping label add for invalid/test message ID");
        return;
    }

    const gmail = createGmailClient();
    if (!gmail) {
        logger.debug({ messageId, labelNames }, "Skipping label add (dry-run)");
        return;
    }

    const labels = Array.isArray(labelNames) ? labelNames : [labelNames];
    const labelIds: string[] = [];

    // Get all label IDs
    for (const labelName of labels) {
        const labelId = await getOrCreateLabel(labelName);
        labelIds.push(labelId);
    }

    // Apply labels
    await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
            addLabelIds: labelIds,
        },
    });

    logger.info({ messageId, labels }, "Labels added to message");

    // Invalidate caches
    cache.invalidatePattern("^gmail:(list|threads):");
}

/**
 * Remove label(s) from a message
 */
export async function removeLabelsFromMessage(
    messageId: string,
    labelNames: string | string[]
): Promise<void> {
    const gmail = createGmailClient();
    if (!gmail) {
        logger.debug({ messageId, labelNames }, "Skipping label remove (dry-run)");
        return;
    }

    const labels = Array.isArray(labelNames) ? labelNames : [labelNames];
    const labelIds: string[] = [];

    // Get all label IDs
    for (const labelName of labels) {
        try {
            const labelId = await getOrCreateLabel(labelName);
            labelIds.push(labelId);
        } catch {
            logger.warn({ labelName }, "Label not found for removal, skipping");
        }
    }

    if (labelIds.length === 0) {
        return;
    }

    // Remove labels
    await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
            removeLabelIds: labelIds,
        },
    });

    logger.info({ messageId, labels }, "Labels removed from message");

    // Invalidate caches
    cache.invalidatePattern("^gmail:(list|threads):");
}

/**
 * Move message from one label to another (atomic operation)
 */
export async function moveMessageLabel(
    messageId: string,
    fromLabel: string,
    toLabel: string
): Promise<void> {
    const gmail = createGmailClient();
    if (!gmail) {
        logger.debug({ messageId, fromLabel, toLabel }, "Skipping label move (dry-run)");
        return;
    }

    const fromLabelId = await getOrCreateLabel(fromLabel);
    const toLabelId = await getOrCreateLabel(toLabel);

    // Atomic operation: remove old + add new
    await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
            addLabelIds: [toLabelId],
            removeLabelIds: [fromLabelId],
        },
    });

    logger.info({ messageId, fromLabel, toLabel }, "Message moved between labels");

    // Invalidate caches
    cache.invalidatePattern("^gmail:(list|threads):");
}

/**
 * Bulk label operations
 */
export async function bulkAddLabels(
    messageIds: string[],
    labelNames: string | string[]
): Promise<void> {
    logger.info({ count: messageIds.length, labelNames }, "Starting bulk label add");

    for (const messageId of messageIds) {
        try {
            await addLabelsToMessage(messageId, labelNames);
        } catch (error) {
            logger.error({ messageId, error }, "Failed to add labels in bulk operation");
        }
    }

    logger.info({ count: messageIds.length }, "Bulk label add completed");
}

export async function bulkMoveLabels(
    messageIds: string[],
    fromLabel: string,
    toLabel: string
): Promise<void> {
    logger.info({ count: messageIds.length, fromLabel, toLabel }, "Starting bulk label move");

    for (const messageId of messageIds) {
        try {
            await moveMessageLabel(messageId, fromLabel, toLabel);
        } catch (error) {
            logger.error({ messageId, error }, "Failed to move label in bulk operation");
        }
    }

    logger.info({ count: messageIds.length }, "Bulk label move completed");
}

/**
 * Get messages by label
 */
export async function getMessagesByLabel(
    labelName: string,
    maxResults: number = 50
): Promise<gmail_v1.Schema$Message[]> {
    const gmail = createGmailClient();
    if (!gmail) {
        logger.debug({ labelName }, "Skipping message fetch by label (dry-run)");
        return [];
    }

    const labelId = await getOrCreateLabel(labelName);

    const response = await gmail.users.messages.list({
        userId: "me",
        labelIds: [labelId],
        maxResults,
    });

    return response.data.messages ?? [];
}

/**
 * Delete a label by name
 */
export async function deleteLabel(labelName: string): Promise<boolean> {
    const gmail = createGmailClient();
    if (!gmail) {
        logger.debug({ labelName }, "Skipping label delete (dry-run)");
        return false;
    }

    try {
        const labelId = await getOrCreateLabel(labelName);

        await gmail.users.labels.delete({
            userId: "me",
            id: labelId,
        });

        // Remove from cache
        labelCache.delete(labelName);
        cache.invalidatePattern("^gmail:labels:");

        logger.info({ labelName, labelId }, "Label deleted successfully");
        return true;
    } catch {
        logger.warn({ labelName }, "Failed to delete label");
        return false;
    }
}

/**
 * Clear label cache (useful for testing or after label changes)
 */
export function clearLabelCache(): void {
    labelCache.clear();
    cache.invalidatePattern("^gmail:labels:");
    logger.info("Label cache cleared");
}
