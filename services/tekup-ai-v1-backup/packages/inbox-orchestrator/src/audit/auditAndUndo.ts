export interface AuditRecord {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  payload: unknown;
}

export class AuditLogger {
  private records: AuditRecord[] = [];
  log(actor: string, action: string, payload: unknown): AuditRecord {
    const rec: AuditRecord = { id: String(Date.now()), timestamp: Date.now(), actor, action, payload };
    this.records.unshift(rec);
    return rec;
  }
  list(limit = 100): AuditRecord[] { return this.records.slice(0, limit); }
}

type UndoHandler = () => Promise<void> | void;

export class UndoManager {
  private windowMs = 5 * 60 * 1000;
  private actions: Map<string, { at: number; undo: UndoHandler }> = new Map();
  register(key: string, undo: UndoHandler): void {
    this.actions.set(key, { at: Date.now(), undo });
  }
  async tryUndo(key: string): Promise<boolean> {
    const entry = this.actions.get(key);
    if (!entry) return false;
    if (Date.now() - entry.at > this.windowMs) return false;
    await entry.undo();
    this.actions.delete(key);
    return true;
  }
}


