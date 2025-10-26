import type { GmailMessageSummary } from "./gmailService";
import { logger } from "../logger";

/**
 * Represents a parsed lead from Leadmail.no
 */
export interface ParsedLead {
    // Lead source
    source: string; // e.g., "Rengøring.nu"
    receivedAt: Date;
    emailId: string;
    threadId: string;

    // Contact information
    name?: string;
    email?: string;
    phone?: string;
    address?: string;

    // Property details
    squareMeters?: number;
    rooms?: number;
    propertyType?: string; // e.g., "Villa/Parcelhus", "Lejlighed"

    // Service details
    taskType?: string; // e.g., "Fast rengøringshjælp", "Flytterengøring"
    serviceNeeded?: string;
    preferredDates?: string[];

    // Additional context
    ownerOrRenter?: string;
    additionalNotes?: string;

    // Raw data
    rawSnippet: string;
}

/**
 * Check if an email is from Leadmail.no
 */
export function isLeadmailEmail(email: GmailMessageSummary): boolean {
    return (
        email.from?.includes("leadmail.no") === true ||
        email.from?.includes("Leadmail.no") === true ||
        email.subject?.includes("Lead fra") === true ||
        email.subject?.includes("Nyt lead fra") === true
    );
}

/**
 * Parse a Leadmail.no email into structured lead data
 */
export function parseLeadEmail(email: GmailMessageSummary): ParsedLead | null {
    try {
        if (!isLeadmailEmail(email)) {
            logger.debug({ emailId: email.id }, "Email is not from Leadmail.no");
            return null;
        }

        const snippet = email.snippet || "";
        const subject = email.subject || "";

        // Parse receivedAt with robust handling for multiple formats
        let receivedAt: Date;
        if (email.internalDate) {
            // Try parsing as ISO string first (e.g., "2025-09-30T14:59:42.000Z")
            const isoTimestamp = Date.parse(email.internalDate);

            if (!isNaN(isoTimestamp)) {
                // Valid ISO string
                receivedAt = new Date(isoTimestamp);
            } else {
                // Fallback: try parsing as Unix timestamp (milliseconds)
                const numericTimestamp = parseInt(email.internalDate, 10);
                if (!isNaN(numericTimestamp) && numericTimestamp > 946684800000) {
                    // Valid timestamp (after year 2000)
                    receivedAt = new Date(numericTimestamp);
                } else {
                    logger.warn({
                        emailId: email.id,
                        internalDate: email.internalDate,
                        isoTimestamp,
                        numericTimestamp,
                    }, "Could not parse email timestamp, using current date");
                    receivedAt = new Date();
                }
            }

            // Final validation: ensure date is reasonable
            if (receivedAt.getFullYear() < 2000 || receivedAt.getFullYear() > 2100) {
                logger.warn({
                    emailId: email.id,
                    internalDate: email.internalDate,
                    parsedYear: receivedAt.getFullYear(),
                }, "Parsed date out of reasonable range, using current date");
                receivedAt = new Date();
            }
        } else {
            receivedAt = new Date();
        }

        // Use full email body if available, otherwise fallback to snippet
        const bodyText = email.body || snippet;

        const lead: ParsedLead = {
            source: extractSource(subject, bodyText),
            receivedAt,
            emailId: email.id,
            threadId: email.threadId,
            rawSnippet: snippet,
        };

        // Extract contact info from full body (better extraction)
        lead.name = extractName(subject, bodyText);
        lead.email = extractEmail(bodyText);
        lead.phone = extractPhone(bodyText);
        lead.address = extractAddress(bodyText);

        // Extract property details from full body
        lead.squareMeters = extractSquareMeters(bodyText);
        lead.rooms = extractRooms(bodyText);
        lead.propertyType = extractPropertyType(bodyText);

        // Extract service details from full body
        lead.taskType = extractTaskType(bodyText);
        lead.serviceNeeded = extractServiceNeeded(bodyText);
        lead.ownerOrRenter = extractOwnerOrRenter(bodyText);

        logger.info(
            {
                emailId: email.id,
                name: lead.name,
                source: lead.source,
                taskType: lead.taskType,
            },
            "Successfully parsed lead email"
        );

        return lead;
    } catch (err) {
        logger.error(
            { err, emailId: email.id },
            "Failed to parse lead email"
        );
        return null;
    }
}

// Helper functions for extracting specific fields

function extractSource(subject: string, snippet: string): string {
    // Try subject first: "Vinni Hansen fra Rengøring.nu"
    const subjectMatch = subject.match(/fra\s+([^\s-]+)/i);
    if (subjectMatch) {
        return subjectMatch[1];
    }

    // Try snippet: "Nyt lead fra Rengøring.nu"
    const snippetMatch = snippet.match(/lead\s+fra\s+([^\s]+)/i);
    if (snippetMatch) {
        return snippetMatch[1];
    }

    return "Unknown";
}

function extractName(subject: string, snippet: string): string | undefined {
    // From subject: "Andreas Slot Tanderup fra Rengøring.nu" or "Vinni Hansen fra Rengøring.nu"
    const subjectMatch = subject.match(/^(.+?)\s+fra\s+/i);
    if (subjectMatch) {
        const name = subjectMatch[1].trim();
        // Filter out common non-name prefixes
        if (!name.toLowerCase().includes("lead") && !name.toLowerCase().includes("nyt")) {
            return name;
        }
    }

    // Try to find name in snippet patterns
    const namePatterns = [
        /Navn[:\s]+([^\n]+)/i,
        /Kontakt[:\s]+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)+)/i,
    ];

    for (const pattern of namePatterns) {
        const match = snippet.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return undefined;
}

function extractEmail(snippet: string): string | undefined {
    // Look for email pattern
    const match = snippet.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1] : undefined;
}

function extractPhone(snippet: string): string | undefined {
    // Danish phone patterns: +45 12345678, 12 34 56 78, 12345678
    const patterns = [
        /\+45\s*\d{8}/,
        /\d{2}\s+\d{2}\s+\d{2}\s+\d{2}/,
        /(?:Telefon|Tlf|Phone)[:\s]+(\d[\d\s]{7,})/i,
    ];

    for (const pattern of patterns) {
        const match = snippet.match(pattern);
        if (match) {
            return match[0].replace(/\s+/g, "");
        }
    }

    return undefined;
}

function extractAddress(snippet: string): string | undefined {
    // Look for address patterns
    const patterns = [
        /Adresse[:\s]+([^\n]+)/i,
        /([A-ZÆØÅ][a-zæøå]+(?:vej|gade|allé|parken|stræde|vænge)\s+\d+[A-Za-z]?(?:,\s*\d{4}\s+[A-ZÆØÅ][a-zæøå]+)?)/,
    ];

    for (const pattern of patterns) {
        const match = snippet.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return undefined;
}

function extractSquareMeters(snippet: string): number | undefined {
    const patterns = [
        /(\d+)\s*m²/i,
        /(\d+)\s*kvadratmeter/i,
        /Størrelse[:\s]+(\d+)/i,
    ];

    for (const pattern of patterns) {
        const match = snippet.match(pattern);
        if (match) {
            return parseInt(match[1], 10);
        }
    }

    return undefined;
}

function extractRooms(snippet: string): number | undefined {
    const patterns = [
        /(\d+)\s*(?:værelse|værelser)/i,
        /Antal\s+rum[:\s]+(\d+)/i,
    ];

    for (const pattern of patterns) {
        const match = snippet.match(pattern);
        if (match) {
            return parseInt(match[1], 10);
        }
    }

    return undefined;
}

function extractPropertyType(snippet: string): string | undefined {
    const patterns = [
        /Boligtype[:\s]+([^\n]+)/i,
        /(Villa\/Parcelhus|Lejlighed|Rækkehus|Andelsbolig)/i,
    ];

    for (const pattern of patterns) {
        const match = snippet.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return undefined;
}

function extractTaskType(snippet: string): string | undefined {
    const patterns = [
        /Behov[:\s]+([^\n]+?)(?:\s+Boligtype|$)/i,
        /(Fast rengøringshjælp|Flytterengøring|Erhvervsrengøring|Vinduespudsning)/i,
    ];

    for (const pattern of patterns) {
        const match = snippet.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return undefined;
}

function extractServiceNeeded(snippet: string): string | undefined {
    const patterns = [
        /Type\s+kontakt[:\s]+([^\n]+)/i,
        /Behov[:\s]+([^\n]+)/i,
    ];

    for (const pattern of patterns) {
        const match = snippet.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return undefined;
}

function extractOwnerOrRenter(snippet: string): string | undefined {
    const match = snippet.match(/Ejer eller lejer[:\s]+([^\n]+)/i);
    return match ? match[1].trim() : undefined;
}
