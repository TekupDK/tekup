/**
 * Data Logger for tracking user patterns and behavior
 * Helps build personalized presets based on usage patterns
 */

import fs from 'fs/promises';
import path from 'path';
import { log as logger } from './logger.js';

export interface UserAction {
  timestamp: string;
  action: string;
  tool: string;
  parameters: any;
  result?: 'success' | 'error';
  metadata?: {
    executionTime?: number;
    errorMessage?: string;
    dataSize?: number;
  };
}

export interface UserPattern {
  userId?: string;
  commonActions: string[];
  preferredParameters: Record<string, any>;
  timePatterns: {
    mostActiveHours: number[];
    mostActiveDays: string[];
  };
  errorPatterns: string[];
  businessType?: string;
}

export class DataLogger {
  private logFile: string;
  private actions: UserAction[] = [];
  private maxLogSize = 1000; // Maximum number of actions to keep in memory

  constructor(logDir = './logs') {
    const timestamp = new Date().toISOString().split('T')[0];
    this.logFile = path.join(logDir, `user-actions-${timestamp}.json`);
    this.ensureLogDirectory(logDir);
  }

  private async ensureLogDirectory(logDir: string): Promise<void> {
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      logger.debug('Could not create log directory', { error });
    }
  }

  async logAction(action: Omit<UserAction, 'timestamp'>): Promise<void> {
    const userAction: UserAction = {
      ...action,
      timestamp: new Date().toISOString(),
    };

    this.actions.push(userAction);

    // Keep only the most recent actions in memory
    if (this.actions.length > this.maxLogSize) {
      this.actions = this.actions.slice(-this.maxLogSize);
    }

    // Persist to file (async, don't wait)
    this.persistToFile().catch(error => 
      logger.debug('Failed to persist user action', { error })
    );
  }

  private async persistToFile(): Promise<void> {
    try {
      await fs.writeFile(this.logFile, JSON.stringify(this.actions, null, 2));
    } catch (error) {
      logger.debug('Failed to write log file', { error });
    }
  }

  async loadExistingLogs(): Promise<void> {
    try {
      const data = await fs.readFile(this.logFile, 'utf-8');
      this.actions = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      this.actions = [];
    }
  }

  analyzePatterns(): UserPattern {
    if (this.actions.length === 0) {
      return {
        commonActions: [],
        preferredParameters: {},
        timePatterns: { mostActiveHours: [], mostActiveDays: [] },
        errorPatterns: [],
      };
    }

    // Analyze common actions
    const actionCounts = this.actions.reduce((acc, action) => {
      acc[action.action] = (acc[action.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action]) => action);

    // Analyze preferred parameters
    const preferredParameters: Record<string, any> = {};
    this.actions.forEach(action => {
      Object.entries(action.parameters || {}).forEach(([key, value]) => {
        if (!preferredParameters[key]) {
          preferredParameters[key] = {};
        }
        const valueKey = JSON.stringify(value);
        preferredParameters[key][valueKey] = (preferredParameters[key][valueKey] || 0) + 1;
      });
    });

    // Convert to most common values
    Object.keys(preferredParameters).forEach(key => {
      const values = preferredParameters[key];
      const mostCommon = Object.entries(values)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0];
      if (mostCommon) {
        preferredParameters[key] = JSON.parse(mostCommon[0]);
      }
    });

    // Analyze time patterns
    const hours = this.actions.map(action => new Date(action.timestamp).getHours());
    const days = this.actions.map(action => new Date(action.timestamp).toLocaleDateString('da-DK', { weekday: 'long' }));

    const hourCounts = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const dayCounts = days.reduce((acc, day) => {
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    const mostActiveDays = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);

    // Analyze error patterns
    const errorActions = this.actions.filter(action => action.result === 'error');
    const errorPatterns = errorActions.map(action => 
      `${action.tool}:${action.action} - ${action.metadata?.errorMessage || 'Unknown error'}`
    );

    return {
      commonActions,
      preferredParameters,
      timePatterns: { mostActiveHours, mostActiveDays },
      errorPatterns: [...new Set(errorPatterns)], // Remove duplicates
    };
  }

  getRecentActions(count = 10): UserAction[] {
    return this.actions.slice(-count);
  }

  async generatePreset(name: string): Promise<any> {
    const patterns = this.analyzePatterns();
    
    const preset = {
      name,
      createdAt: new Date().toISOString(),
      patterns,
      suggestedDefaults: patterns.preferredParameters,
      commonWorkflows: patterns.commonActions,
      metadata: {
        basedOnActions: this.actions.length,
        timeRange: {
          from: this.actions[0]?.timestamp,
          to: this.actions[this.actions.length - 1]?.timestamp,
        },
      },
    };

    // Save preset to file
    const presetFile = path.join('./presets', `${name.toLowerCase().replace(/\s+/g, '-')}.json`);
    try {
      await fs.mkdir('./presets', { recursive: true });
      await fs.writeFile(presetFile, JSON.stringify(preset, null, 2));
    } catch (error) {
      logger.debug('Failed to save preset', { error });
    }

    return preset;
  }
}

// Global instance
export const dataLogger = new DataLogger();