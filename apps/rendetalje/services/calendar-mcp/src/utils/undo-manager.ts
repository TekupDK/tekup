/**
 * RenOS Calendar Intelligence MCP - Undo Manager
 * 5-minute window to undo critical actions
 */

import { v4 as uuidv4 } from 'uuid';
import { UndoAction } from '../types.js';
import { logger } from './logger.js';

class UndoManager {
  private actions: Map<string, UndoAction> = new Map();
  private readonly undoWindowMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Register an undoable action
   */
  registerAction(params: {
    type: UndoAction['type'];
    entityId: string;
    entityType: UndoAction['entityType'];
    before: unknown;
    after: unknown;
    performedBy: string;
  }): string {
    const id = uuidv4();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.undoWindowMs).toISOString();

    const action: UndoAction = {
      id,
      type: params.type,
      entityId: params.entityId,
      entityType: params.entityType,
      before: params.before,
      after: params.after,
      performedBy: params.performedBy,
      performedAt: now,
      expiresAt,
    };

    this.actions.set(id, action);

    // Auto-cleanup after expiration
    setTimeout(() => {
      this.actions.delete(id);
      logger.debug('Undo action expired and removed', { actionId: id });
    }, this.undoWindowMs);

    logger.info('Undoable action registered', {
      actionId: id,
      type: params.type,
      entityId: params.entityId,
      expiresAt,
    });

    return id;
  }

  /**
   * Check if an action can be undone
   */
  canUndo(actionId: string): boolean {
    const action = this.actions.get(actionId);
    if (!action) return false;

    const now = new Date();
    const expires = new Date(action.expiresAt);
    
    return now < expires && !action.undoneAt;
  }

  /**
   * Get undo action details
   */
  getAction(actionId: string): UndoAction | undefined {
    return this.actions.get(actionId);
  }

  /**
   * Mark action as undone (actual undo logic handled by caller)
   */
  markAsUndone(actionId: string, undoneBy: string): boolean {
    const action = this.actions.get(actionId);
    if (!action) {
      logger.warn('Attempted to undo non-existent action', { actionId });
      return false;
    }

    if (!this.canUndo(actionId)) {
      logger.warn('Attempted to undo expired or already undone action', { 
        actionId,
        expiresAt: action.expiresAt,
        undoneAt: action.undoneAt,
      });
      return false;
    }

    action.undoneAt = new Date().toISOString();
    action.undoneBy = undoneBy;

    logger.info('Action marked as undone', {
      actionId,
      type: action.type,
      entityId: action.entityId,
      undoneBy,
    });

    return true;
  }

  /**
   * Get all active (undoable) actions
   */
  getActiveActions(): UndoAction[] {
    const now = new Date();
    return Array.from(this.actions.values()).filter(action => {
      const expires = new Date(action.expiresAt);
      return now < expires && !action.undoneAt;
    });
  }

  /**
   * Get recent actions (for audit/history)
   */
  getRecentActions(limit: number = 10): UndoAction[] {
    const actions = Array.from(this.actions.values());
    actions.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
    return actions.slice(0, limit);
  }
}

// Singleton instance
export const undoManager = new UndoManager();

export default undoManager;

