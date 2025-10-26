import type { TaskHandler } from "./types";
import { parseComplaintPayload } from "./complaintPayload";
import { findComplaintThread } from "./complaintThread";
import { sendComplaintEmail } from "./complaintEmail";
import { storeComplaintMemory } from "./complaintMemory";
import { buildComplaintAction } from "./complaintAction";

export const handleComplaintEmail: TaskHandler = async (task) => {
    const payload = parseComplaintPayload(task.payload);
    const threadId = await findComplaintThread(payload);
    const summary = await sendComplaintEmail(payload, threadId);
    storeComplaintMemory(task.id, payload);
    return buildComplaintAction(task, summary, threadId);
};
