import { upsertMemory } from "../../services/memoryStore";
import type { ComplaintPayload } from "./complaintPayload";

export function storeComplaintMemory(taskId: string, payload: ComplaintPayload) {
    upsertMemory({
        id: `complaint-${taskId}`,
        type: "complaint",
        content: {
            lead: payload.lead,
            originalMessage: payload.originalMessage,
            respondedAt: new Date().toISOString(),
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });
}
