import { google, gmail_v1 } from "googleapis";
import { nanoid } from "nanoid";
import { googleConfig, isLiveMode } from "../config";
import { logger } from "../logger";
import { getGoogleAuthClient } from "./googleAuth";
import { cache, CacheKeys, CacheTTL } from "./cacheService";

const gmailScopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify"
];

export interface GmailMessageInput {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
    labels?: string[];
    fromName?: string;
}

export interface ThreadSearchParams {
    query: string;
    maxResults?: number;
}

export interface GmailDraftSummary {
    id: string;
    to: string;
    subject: string;
    bodyPreview: string;
    dryRun: boolean;
}

export interface GmailListOptions {
    maxResults?: number;
    labelIds?: string[];
    query?: string;
}

export interface GmailMessageSummary {
    id: string;
    threadId: string;
    snippet: string;
    subject?: string;
    from?: string;
    internalDate?: string;
    body?: string; // Full email body content
}

function createGmailClient(): gmail_v1.Gmail | null {
    const auth = getGoogleAuthClient(gmailScopes);
    if (!auth) {
        return null;
    }

    return google.gmail({ version: "v1", auth });
}

export async function searchThreads(
    params: ThreadSearchParams
): Promise<gmail_v1.Schema$Thread[]> {
    // Check cache first
    const cacheKey = `gmail:threads:${params.query}:${params.maxResults || 5}`;
    const cached = await cache.get<gmail_v1.Schema$Thread[]>(cacheKey);
    if (cached) {
        return cached;
    }

    const gmail = createGmailClient();
    if (!gmail) {
        logger.debug({ params }, "Skipping Gmail thread search (dry-run)");
        return [];
    }

    // Ensure maxResults is a valid number
    const validMaxResults = params.maxResults && !isNaN(params.maxResults) && params.maxResults > 0
        ? params.maxResults
        : 5;

    const response = await gmail.users.threads.list({
        userId: "me",
        q: params.query,
        maxResults: validMaxResults,
    });

    const threads = response.data.threads ?? [];

    // Cache the result
    await cache.set(cacheKey, threads, CacheTTL.thread);

    return threads;
}

export async function sendOfferEmail(
    input: GmailMessageInput
): Promise<GmailDraftSummary> {
    return sendGenericEmail(input);
}

export async function sendGenericEmail(
    input: GmailMessageInput
): Promise<GmailDraftSummary> {
    const gmail = createGmailClient();
    const body = buildMimeMessage(input);

    if (!gmail || !isLiveMode) {
        const draft: GmailDraftSummary = {
            id: nanoid(),
            to: input.to,
            subject: input.subject,
            bodyPreview: input.body.slice(0, 120),
            dryRun: true,
        };

        logger.info({ draft }, "Drafted offer email (dry-run mode)");
        return draft;
    }

    const encodedMessage = Buffer.from(body).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");

    const { data } = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
            raw: encodedMessage,
            threadId: input.threadId,
        },
    });

    logger.info({ messageId: data.id }, "Offer email sent via Gmail");

    // Invalidate email list caches since we just sent a new message
    cache.invalidatePattern("^gmail:(list|threads):");

    return {
        id: data.id ?? nanoid(),
        to: input.to,
        subject: input.subject,
        bodyPreview: input.body.slice(0, 120),
        dryRun: false,
    };
}

function extractHeader(
    headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
    name: string
): string | undefined {
    const header = headers?.find((candidate) => candidate.name?.toLowerCase() === name.toLowerCase());
    return header?.value ?? undefined;
}

/**
 * Extract text content from Gmail message payload (handles MIME multipart)
 */
function extractEmailBody(payload: gmail_v1.Schema$MessagePart): string {
    let bodyText = "";

    // If this part has body data, decode it
    if (payload.body?.data) {
        bodyText += Buffer.from(payload.body.data, "base64").toString("utf-8");
    }

    // Recursively extract from nested parts (multipart emails)
    if (payload.parts && payload.parts.length > 0) {
        for (const part of payload.parts) {
            // Prefer text/plain or text/html parts
            const mimeType = part.mimeType?.toLowerCase();
            if (mimeType === "text/plain" || mimeType === "text/html") {
                bodyText += extractEmailBody(part);
            }
        }
    }

    return bodyText;
}

export async function listRecentMessages(
    options: GmailListOptions = {}
): Promise<GmailMessageSummary[]> {
    const { maxResults = 5, labelIds, query } = options;

    // Check cache first
    const cacheKey = CacheKeys.emailList(maxResults, query);
    const cached = await cache.get<GmailMessageSummary[]>(cacheKey);
    if (cached) {
        return cached;
    }

    const gmail = createGmailClient();
    if (!gmail) {
        logger.debug({ options }, "Skipping Gmail message fetch (dry-run)");
        return [];
    }

    // Ensure maxResults is a valid number (prevent NaN from causing 400 Bad Request)
    const validMaxResults = !isNaN(maxResults) && maxResults > 0 ? maxResults : 5;

    const { data } = await gmail.users.messages.list({
        userId: "me",
        maxResults: validMaxResults,
        labelIds,
        q: query,
        includeSpamTrash: false,
    });

    const messages = data.messages ?? [];

    if (messages.length === 0) {
        return [];
    }

    const results: GmailMessageSummary[] = [];

    for (const message of messages) {
        if (!message.id) {
            continue;
        }

        const { data: full } = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "full", // Changed from "metadata" to get full email body
        });

        const headers = full.payload?.headers;

        // Extract email body from MIME parts
        let emailBody = "";
        if (full.payload) {
            emailBody = extractEmailBody(full.payload);
        }

        results.push({
            id: full.id ?? message.id,
            threadId: full.threadId ?? message.threadId ?? "",
            snippet: full.snippet ?? message.snippet ?? "",
            subject: extractHeader(headers, "Subject"),
            from: extractHeader(headers, "From"),
            internalDate: full.internalDate
                ? new Date(Number(full.internalDate)).toISOString()
                : undefined,
            body: emailBody, // Include full email body
        });
    }

    // Cache the results
    await cache.set(cacheKey, results, CacheTTL.emailList);

    return results;
}

function buildMimeMessage({ to, subject, body, fromName }: GmailMessageInput): string {
    const fromAddress =
        googleConfig.DEFAULT_EMAIL_FROM ??
        googleConfig.GOOGLE_IMPERSONATED_USER ??
        googleConfig.GOOGLE_CLIENT_EMAIL ??
        "info@rendetalje.dk";
    const displayName = fromName ?? "Rendetalje.dk";

    const lines = [
        `From: ${displayName} <${fromAddress}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "Content-Type: text/html; charset=UTF-8",
        "MIME-Version: 1.0",
        "",
        body,
    ];

    return lines.join("\r\n");
}

// Export service object for backward compatibility
export const gmailService = {
    sendGenericEmail,
    sendOfferEmail,
    listMessages: listRecentMessages,
    searchThreads,
};
