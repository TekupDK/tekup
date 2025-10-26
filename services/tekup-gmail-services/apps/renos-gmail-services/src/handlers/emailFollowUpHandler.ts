import { z } from "zod";
import type { TaskHandler, ExecutionAction } from "./types";
import { logger } from "../../logger";
import { findLeadsNeedingFollowUp, sendAllFollowUps } from "../../services/followUpService";

const FollowUpPayloadSchema = z
  .object({
    dryRun: z.boolean().default(true),
  })
  .default({ dryRun: true });

export const handleEmailFollowUp: TaskHandler = async (task) => {
  const { dryRun } = FollowUpPayloadSchema.parse(task.payload ?? {});

  const leads = await findLeadsNeedingFollowUp();

  if (leads.length === 0) {
    const detail = "Ingen leads behøver opfølgning lige nu";
    return {
      taskId: task.id,
      provider: task.provider,
      status: "success",
      detail,
    } satisfies ExecutionAction;
  }

  try {
    const results = await sendAllFollowUps(Boolean(dryRun));

    const successCount = results.filter((r) => r.sent).length;
    const failCount = results.filter((r) => !r.sent).length;

    const detail = dryRun
      ? `Opfølgning klar for ${leads.length} lead(s) (dry run)`
      : `Opfølgning sendt til ${successCount} lead(s)${failCount > 0 ? `, ${failCount} fejlede` : ""}`;

    return {
      taskId: task.id,
      provider: task.provider,
      status: dryRun ? "queued" : successCount > 0 ? "success" : "failed",
      detail,
    } satisfies ExecutionAction;
  } catch (error) {
    logger.error({ err: error }, "Follow-up handler failed");
    return {
      taskId: task.id,
      provider: task.provider,
      status: "failed",
      detail: `Fejl ved opfølgning: ${String((error as Error).message ?? error)}`,
    } satisfies ExecutionAction;
  }
};