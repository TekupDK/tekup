import { upsertMemory } from "../../services/memoryStore";
import type { TaskHandler, ExecutionAction } from "./types";

export const handleMemoryUpdate: TaskHandler = (task) => {
    upsertMemory({
        id: task.id,
        type: "lead",
        content: task.payload,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    return Promise.resolve({
        taskId: task.id,
        provider: task.provider,
        status: "success",
        detail: "Lead gemt i hukommelsen",
    } satisfies ExecutionAction);
};

export const handleAutomationUpdate: TaskHandler = (task) => {
    upsertMemory({
        id: `automation-${task.id}`,
        type: "automation",
        content: task.payload ?? {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    return Promise.resolve({
        taskId: task.id,
        provider: task.provider,
        status: "success",
        detail: "Automationsregel opdateret",
    } satisfies ExecutionAction);
};
