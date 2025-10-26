import type { PlannedTask, ExecutionResult } from "../../types";

export type ExecutionAction = ExecutionResult["actions"][number];
export type TaskHandler = (task: PlannedTask) => Promise<ExecutionAction>;
