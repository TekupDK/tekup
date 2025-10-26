import type { PlannedTask } from "../../types";
import type { ExecutionAction } from "./types";
import type { ComplaintEmailSummary } from "./complaintEmail";

const STATUS_SEQUENCE = ["success", "queued"] as const;
const DETAIL_SEQUENCE = ["Klage besvaret med standardformat", "Svar sendt i eksisterende klage-tråd"] as const;

export function buildComplaintAction(
    task: PlannedTask,
    summary: ComplaintEmailSummary,
    threadId: string | undefined
): ExecutionAction {
    const status = STATUS_SEQUENCE[Number(summary.dryRun)] ?? "success";
    const detail = DETAIL_SEQUENCE[Number(Boolean(threadId))];

    return {
        taskId: task.id,
        provider: task.provider,
        status,
        detail,
    } satisfies ExecutionAction;
}
