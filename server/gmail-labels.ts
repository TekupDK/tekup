/**
 * Gmail Label Management Service
 * Handles all label operations for Friday AI v2 email management
 */

import { JWT } from "google-auth-library";
import { google } from "googleapis";

// Service Account Configuration
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const IMPERSONATED_USER =
  process.env.GOOGLE_IMPERSONATED_USER || "info@rendetalje.dk";

// OAuth Scopes
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.readonly",
];

/**
 * Standard Friday AI v2 labels that should exist
 */
export const STANDARD_LABELS = [
  "Leads",
  "Needs Reply",
  "Venter på svar",
  "I kalender",
  "Finance",
  "Afsluttet",
] as const;

export type StandardLabel = (typeof STANDARD_LABELS)[number];

/**
 * Create authenticated JWT client with domain-wide delegation
 */
async function getAuthClient(): Promise<JWT> {
  let credentials;

  try {
    const { readFileSync, existsSync } = await import("fs");
    const { join } = await import("path");
    const credentialsPath = join(process.cwd(), "google-service-account.json");

    if (existsSync(credentialsPath)) {
      credentials = JSON.parse(readFileSync(credentialsPath, "utf8"));
    } else if (SERVICE_ACCOUNT_KEY) {
      credentials = JSON.parse(SERVICE_ACCOUNT_KEY);
    } else {
      throw new Error("Google Service Account credentials not found");
    }
  } catch (error) {
    console.error("Error loading Google Service Account credentials:", error);
    throw new Error("Invalid Google Service Account configuration");
  }

  const client = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
    subject: IMPERSONATED_USER,
  });

  return client;
}

interface LabelCache {
  id: string;
  name: string;
}

// In-memory label cache
const labelCache = new Map<string, LabelCache>();

/**
 * Get all Gmail labels
 */
export async function getGmailLabels(): Promise<
  Array<{ id: string; name: string }>
> {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.labels.list({
      userId: "me",
    });

    if (!response.data.labels) {
      return [];
    }

    // Filter out system labels and return user labels
    const userLabels = response.data.labels
      .filter(label => label.type === "user")
      .map(label => ({
        id: label.id || "",
        name: label.name || "",
      }));

    // Update cache
    userLabels.forEach(label => {
      labelCache.set(label.name, label);
    });

    return userLabels;
  } catch (error) {
    console.error("Error getting Gmail labels:", error);
    throw error;
  }
}

/**
 * Get label ID by name, create if doesn't exist
 */
export async function getOrCreateLabel(labelName: string): Promise<string> {
  try {
    // Check cache first
    if (labelCache.has(labelName)) {
      return labelCache.get(labelName)!.id;
    }

    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    // First, try to find existing label
    const labels = await getGmailLabels();
    const existingLabel = labels.find(l => l.name === labelName);

    if (existingLabel) {
      labelCache.set(labelName, existingLabel);
      return existingLabel.id;
    }

    // Label doesn't exist, create it
    const response = await gmail.users.labels.create({
      userId: "me",
      requestBody: {
        name: labelName,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      },
    });

    const newLabel = {
      id: response.data.id || "",
      name: labelName,
    };

    labelCache.set(labelName, newLabel);
    console.log(`Created Gmail label: ${labelName} (${newLabel.id})`);

    return newLabel.id;
  } catch (error) {
    console.error(`Error getting/creating label ${labelName}:`, error);
    throw error;
  }
}

/**
 * Ensure all standard labels exist in Gmail
 */
export async function ensureStandardLabels(): Promise<void> {
  console.log("Ensuring all standard Friday AI v2 labels exist...");

  for (const labelName of STANDARD_LABELS) {
    try {
      await getOrCreateLabel(labelName);
      console.log(`Standard label verified: ${labelName}`);
    } catch (error) {
      console.error(`Failed to create standard label ${labelName}:`, error);
    }
  }

  console.log("All standard labels verified");
}

/**
 * Add label to thread
 */
export async function addLabelToThread(
  threadId: string,
  labelName: string
): Promise<void> {
  try {
    const labelId = await getOrCreateLabel(labelName);
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    await gmail.users.threads.modify({
      userId: "me",
      id: threadId,
      requestBody: {
        addLabelIds: [labelId],
      },
    });

    console.log(`Added label ${labelName} to thread ${threadId}`);
  } catch (error) {
    console.error(
      `Error adding label ${labelName} to thread ${threadId}:`,
      error
    );
    throw error;
  }
}

/**
 * Remove label from thread
 */
export async function removeLabelFromThread(
  threadId: string,
  labelName: string
): Promise<void> {
  try {
    const labelId = await getOrCreateLabel(labelName);
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    await gmail.users.threads.modify({
      userId: "me",
      id: threadId,
      requestBody: {
        removeLabelIds: [labelId],
      },
    });

    console.log(`Removed label ${labelName} from thread ${threadId}`);
  } catch (error) {
    console.error(
      `Error removing label ${labelName} from thread ${threadId}:`,
      error
    );
    throw error;
  }
}

/**
 * Add label to message (single message, not thread)
 */
export async function addLabelToMessage(
  messageId: string,
  labelName: string
): Promise<void> {
  try {
    const labelId = await getOrCreateLabel(labelName);
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        addLabelIds: [labelId],
      },
    });

    console.log(`Added label ${labelName} to message ${messageId}`);
  } catch (error) {
    console.error(
      `Error adding label ${labelName} to message ${messageId}:`,
      error
    );
    throw error;
  }
}

/**
 * Remove label from message
 */
export async function removeLabelFromMessage(
  messageId: string,
  labelName: string
): Promise<void> {
  try {
    const labelId = await getOrCreateLabel(labelName);
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: [labelId],
      },
    });

    console.log(`Removed label ${labelName} from message ${messageId}`);
  } catch (error) {
    console.error(
      `Error removing label ${labelName} from message ${messageId}:`,
      error
    );
    throw error;
  }
}

/**
 * Archive thread (remove INBOX label)
 */
export async function archiveThread(threadId: string): Promise<void> {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    await gmail.users.threads.modify({
      userId: "me",
      id: threadId,
      requestBody: {
        removeLabelIds: ["INBOX"],
      },
    });

    console.log(`Archived thread ${threadId}`);
  } catch (error) {
    console.error(`Error archiving thread ${threadId}:`, error);
    throw error;
  }
}

/**
 * Map label IDs to human-readable label names
 * System labels (INBOX, SENT, etc.) are filtered out
 */
export async function mapLabelIdsToNames(
  labelIds: string[]
): Promise<string[]> {
  try {
    // System labels to filter out (ikke bruger-synlige)
    const systemLabels = [
      "INBOX",
      "SENT",
      "DRAFT",
      "SPAM",
      "TRASH",
      "UNREAD",
      "STARRED",
      "IMPORTANT",
      "CATEGORY_PERSONAL",
      "CATEGORY_SOCIAL",
      "CATEGORY_PROMOTIONS",
      "CATEGORY_UPDATES",
      "CATEGORY_FORUMS",
    ];

    // Filter out system labels
    const userLabelIds = labelIds.filter(id => !systemLabels.includes(id));
    if (userLabelIds.length === 0) return [];

    // Get all labels (uses cache if available)
    const allLabels = await getGmailLabels();

    // Map IDs to names
    const labelNames = userLabelIds
      .map(id => {
        const label = allLabels.find(l => l.id === id);
        return label?.name || id; // Fallback til ID hvis navn ikke findes
      })
      .filter(Boolean);

    return labelNames;
  } catch (error) {
    console.error("Error mapping label IDs to names:", error);
    // Fallback: return IDs as-is hvis mapping fejler
    return labelIds;
  }
}
