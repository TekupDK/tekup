import type { ChatMessage } from "../types";

interface MemoryRecord {
    id: string;
    userId?: string;
    type: "lead" | "complaint" | "automation" | "note";
    content: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}

const memoryStore = new Map<string, MemoryRecord>();

export function upsertMemory(record: MemoryRecord): void {
    memoryStore.set(record.id, { ...record, updatedAt: Date.now() });
}

export function listMemories(filters?: {
    userId?: string;
    type?: MemoryRecord["type"];
    limit?: number;
}): MemoryRecord[] {
    const entries = Array.from(memoryStore.values());
    const filtered = entries.filter((item) => {
        if (filters?.userId && item.userId !== filters.userId) {
            return false;
        }
        if (filters?.type && item.type !== filters.type) {
            return false;
        }
        return true;
    });

    return filtered.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, filters?.limit ?? 20);
}

export function appendHistory(
    sessionId: string,
    message: ChatMessage
): void {
    const record = memoryStore.get(sessionId);
    if (!record) {
        memoryStore.set(sessionId, {
            id: sessionId,
            type: "note",
            content: { history: [message] },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return;
    }

    const history = (record.content.history as ChatMessage[] | undefined) ?? [];
    history.push(message);
    memoryStore.set(sessionId, {
        ...record,
        content: { ...record.content, history },
        updatedAt: Date.now(),
    });
}

export function getHistory(sessionId: string): ChatMessage[] {
    const record = memoryStore.get(sessionId);
    const history = (record?.content.history as ChatMessage[] | undefined) ?? [];
    return [...history];
}
