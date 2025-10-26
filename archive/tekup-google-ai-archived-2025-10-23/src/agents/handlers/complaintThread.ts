import { searchThreads } from "../../services/gmailService";
import { logger } from "../../logger";
import type { ComplaintPayload } from "./complaintPayload";

export async function findComplaintThread(payload: ComplaintPayload): Promise<string | undefined> {
    try {
        const threads = await searchThreads({
            query: `to:${payload.lead.email} subject:${payload.subject}`,
            maxResults: 1,
        });

        return threads[0]?.id ?? undefined;
    } catch (error) {
        logger.warn({ err: error, to: payload.lead.email, subject: payload.subject }, "Failed to lookup complaint threads");
        return undefined;
    }
}
