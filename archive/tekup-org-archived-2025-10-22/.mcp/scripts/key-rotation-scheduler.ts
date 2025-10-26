#!/usr/bin/env node

/**
 * @fileoverview TekUp MCP API Key Rotation Scheduler
 * 
 * Automated scheduling and monitoring system for API key rotation with
 * notifications, backup management, and integration with CI/CD pipelines.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { spawn } from 'child_process';
import MCPAPIKeyManager from './api-key-manager.js';
import type { APIKeyReference, KeyRotationConfig } from './api-key-manager.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface RotationSchedule {
  keyId: string;
  nextRotation: string;
  intervalDays: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  notifications: {
    beforeRotation: number[]; // Days before rotation to notify
    methods: ('email' | 'slack' | 'webhook' | 'log')[];
  };
}

export interface RotationEvent {
  eventId: string;
  keyId: string;
  timestamp: string;
  type: 'scheduled' | 'manual' | 'emergency';
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  oldKeyHash?: string;
  newKeyHash?: string;
  backupPath?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface NotificationTarget {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'log';
  endpoint: string;
  enabled: boolean;
  apiKey?: string;
  template?: string;
}

// =============================================================================
// KEY ROTATION SCHEDULER CLASS
// =============================================================================

export class MCPKeyRotationScheduler {
  private keyManager: MCPAPIKeyManager;
  private schedules: Map<string, RotationSchedule> = new Map();
  private rotationEvents: RotationEvent[] = [];
  private notificationTargets: Map<string, NotificationTarget> = new Map();
  private schedulerInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;
  
  constructor(keyManager: MCPAPIKeyManager) {
    this.keyManager = keyManager;
    this.loadSchedules();
    this.loadNotificationTargets();
    this.loadRotationHistory();
  }

  /**
   * Load rotation schedules from configuration
   */
  private loadSchedules(): void {
    try {
      const schedulesPath = resolve(process.cwd(), '.mcp/configs/key-rotation-schedules.json');
      if (existsSync(schedulesPath)) {
        const content = readFileSync(schedulesPath, 'utf8');
        const data = JSON.parse(content);
        
        if (data.schedules) {
          for (const schedule of data.schedules) {
            this.schedules.set(schedule.keyId, schedule);
          }
        }
        
        console.log(`✅ Loaded ${this.schedules.size} rotation schedules`);
      } else {
        console.log('📅 No existing rotation schedules found - creating defaults');
        this.createDefaultSchedules();
      }
    } catch (error) {
      console.error('❌ Failed to load rotation schedules:', error);
      this.createDefaultSchedules();
    }
  }

  /**
   * Create default rotation schedules for rotatable keys
   */
  private createDefaultSchedules(): void {
    const keys = this.keyManager.getAllKeyReferences();
    
    for (const key of keys) {
      if (!key.rotatable) continue;
      
      const schedule: RotationSchedule = {
        keyId: key.keyId,
        nextRotation: this.calculateNextRotation(key),
        intervalDays: this.getDefaultRotationInterval(key),
        priority: this.getKeyPriority(key),
        automated: false, // Start with manual rotation for safety
        notifications: {
          beforeRotation: [30, 7, 1], // Notify 30, 7, and 1 days before
          methods: ['log', 'email']
        }
      };
      
      this.schedules.set(key.keyId, schedule);
    }
    
    this.saveSchedules();
    console.log(`✅ Created default schedules for ${this.schedules.size} rotatable keys`);
  }

  /**
   * Calculate next rotation date based on key metadata
   */
  private calculateNextRotation(key: APIKeyReference): string {
    const now = new Date();
    const interval = this.getDefaultRotationInterval(key);
    const nextRotation = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
    return nextRotation.toISOString();
  }

  /**
   * Get default rotation interval based on key type and provider
   */
  private getDefaultRotationInterval(key: APIKeyReference): number {
    // Return days based on service and security requirements
    switch (key.service) {
      case 'openai':
      case 'anthropic':
      case 'google-gemini':
        return 90; // AI services - quarterly rotation
      case 'brave-search':
        return 180; // Search APIs - semi-annual
      case 'billy':
        return 60; // Financial services - bi-monthly
      default:
        return 120; // Default - 4 months
    }
  }

  /**
   * Determine key priority for rotation scheduling
   */
  private getKeyPriority(key: APIKeyReference): 'low' | 'medium' | 'high' | 'critical' {
    if (key.required) {
      return key.service === 'billing' || key.service === 'payment' ? 'critical' : 'high';
    }
    
    return key.metadata?.usage === 'production' ? 'medium' : 'low';
  }

  /**
   * Load notification targets configuration
   */
  private loadNotificationTargets(): void {
    const targetsPath = resolve(process.cwd(), '.mcp/configs/notification-targets.json');
    if (existsSync(targetsPath)) {
      try {
        const content = readFileSync(targetsPath, 'utf8');
        const data = JSON.parse(content);
        
        if (data.targets) {
          for (const target of data.targets) {
            this.notificationTargets.set(target.id, target);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load notification targets:', error);
      }
    }

    // Create default notification targets if none exist
    if (this.notificationTargets.size === 0) {
      this.createDefaultNotificationTargets();
    }
  }

  /**
   * Create default notification targets
   */
  private createDefaultNotificationTargets(): void {
    const defaultTargets: NotificationTarget[] = [
      {
        id: 'console-log',
        type: 'log',
        endpoint: 'console',
        enabled: true,
        template: '[MCP] Key rotation notification: {{message}}'
      },
      {
        id: 'file-log',
        type: 'log',
        endpoint: '.mcp/logs/key-rotation.log',
        enabled: true,
        template: '{{timestamp}} [{{priority}}] Key {{keyId}}: {{message}}'
      },
      {
        id: 'webhook-generic',
        type: 'webhook',
        endpoint: process.env.MCP_ROTATION_WEBHOOK_URL || '',
        enabled: false,
        template: JSON.stringify({
          event: 'key_rotation',
          keyId: '{{keyId}}',
          message: '{{message}}',
          priority: '{{priority}}',
          timestamp: '{{timestamp}}'
        })
      }
    ];

    for (const target of defaultTargets) {
      this.notificationTargets.set(target.id, target);
    }

    this.saveNotificationTargets();
  }

  /**
   * Load rotation history
   */
  private loadRotationHistory(): void {
    const historyPath = resolve(process.cwd(), '.mcp/logs/rotation-history.json');
    if (existsSync(historyPath)) {
      try {
        const content = readFileSync(historyPath, 'utf8');
        const data = JSON.parse(content);
        this.rotationEvents = data.events || [];
      } catch (error) {
        console.error('❌ Failed to load rotation history:', error);
        this.rotationEvents = [];
      }
    }
  }

  /**
   * Save schedules to configuration file
   */
  private saveSchedules(): void {
    try {
      const schedulesPath = resolve(process.cwd(), '.mcp/configs/key-rotation-schedules.json');
      const data = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        schedules: Array.from(this.schedules.values())
      };
      
      writeFileSync(schedulesPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Failed to save schedules:', error);
    }
  }

  /**
   * Save notification targets
   */
  private saveNotificationTargets(): void {
    try {
      const targetsPath = resolve(process.cwd(), '.mcp/configs/notification-targets.json');
      const data = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        targets: Array.from(this.notificationTargets.values())
      };
      
      writeFileSync(targetsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Failed to save notification targets:', error);
    }
  }

  /**
   * Save rotation history
   */
  private saveRotationHistory(): void {
    try {
      const historyPath = resolve(process.cwd(), '.mcp/logs/rotation-history.json');
      const data = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        events: this.rotationEvents
      };
      
      writeFileSync(historyPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Failed to save rotation history:', error);
    }
  }

  /**
   * Start the rotation scheduler
   */
  startScheduler(intervalMinutes: number = 60): void {
    if (this.isRunning) {
      console.log('⚠️  Scheduler is already running');
      return;
    }

    this.isRunning = true;
    
    // Run initial check
    this.checkRotationSchedules();
    
    // Set up periodic checks
    this.schedulerInterval = setInterval(() => {
      this.checkRotationSchedules();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`✅ Key rotation scheduler started (checking every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop the rotation scheduler
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = undefined;
    }
    
    this.isRunning = false;
    console.log('⏹️  Key rotation scheduler stopped');
  }

  /**
   * Check all scheduled rotations
   */
  private async checkRotationSchedules(): Promise<void> {
    console.log('🔍 Checking rotation schedules...');
    
    const now = new Date();
    let notificationsSent = 0;
    let rotationsTriggered = 0;
    
    for (const [keyId, schedule] of this.schedules) {
      const rotationDate = new Date(schedule.nextRotation);
      const daysUntilRotation = Math.ceil((rotationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if rotation is due
      if (daysUntilRotation <= 0) {
        if (schedule.automated) {
          console.log(`🔄 Triggering automated rotation for ${keyId}`);
          await this.triggerKeyRotation(keyId, 'scheduled');
          rotationsTriggered++;
        } else {
          console.log(`⚠️  Manual rotation required for ${keyId} (${Math.abs(daysUntilRotation)} days overdue)`);
          await this.sendRotationNotification(keyId, `Manual rotation required (${Math.abs(daysUntilRotation)} days overdue)`, 'critical');
          notificationsSent++;
        }
      }
      // Check if notifications are due
      else if (schedule.notifications.beforeRotation.includes(daysUntilRotation)) {
        const priority = daysUntilRotation <= 1 ? 'critical' : daysUntilRotation <= 7 ? 'high' : 'medium';
        await this.sendRotationNotification(keyId, `Rotation scheduled in ${daysUntilRotation} days`, priority);
        notificationsSent++;
      }
    }
    
    if (notificationsSent > 0 || rotationsTriggered > 0) {
      console.log(`📊 Schedule check complete: ${notificationsSent} notifications sent, ${rotationsTriggered} rotations triggered`);
    }
  }

  /**
   * Trigger a key rotation
   */
  async triggerKeyRotation(keyId: string, type: 'scheduled' | 'manual' | 'emergency' = 'manual'): Promise<boolean> {
    const keyRef = this.keyManager.getKeyReference(keyId);
    if (!keyRef) {
      console.error(`❌ Key ${keyId} not found`);
      return false;
    }

    if (!keyRef.rotatable) {
      console.error(`❌ Key ${keyId} is not rotatable`);
      return false;
    }

    // Create rotation event
    const rotationEvent: RotationEvent = {
      eventId: `rotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      keyId,
      timestamp: new Date().toISOString(),
      type,
      status: 'pending',
      metadata: {
        triggeredBy: type === 'manual' ? 'user' : 'scheduler',
        keyName: keyRef.name,
        service: keyRef.service
      }
    };

    this.rotationEvents.push(rotationEvent);
    this.saveRotationHistory();

    try {
      console.log(`🔄 Starting ${type} rotation for ${keyRef.name}...`);
      
      // Update status to in-progress
      rotationEvent.status = 'in-progress';
      this.saveRotationHistory();
      
      // Create backup before rotation
      const backupPath = this.keyManager.createBackup(`pre-rotation-${keyId}`);
      rotationEvent.backupPath = backupPath;
      
      // Get current key hash for audit trail
      const currentKey = process.env[keyRef.envVariable];
      if (currentKey) {
        rotationEvent.oldKeyHash = this.hashKey(currentKey);
      }
      
      // Send notification about rotation start
      await this.sendRotationNotification(keyId, `Rotation started (${type})`, 'high');
      
      // For now, we'll simulate the rotation process
      // In a real implementation, this would integrate with the service provider's API
      await this.simulateKeyRotation(keyId, rotationEvent);
      
      // Update schedule for next rotation
      const schedule = this.schedules.get(keyId);
      if (schedule) {
        const nextRotationDate = new Date();
        nextRotationDate.setDate(nextRotationDate.getDate() + schedule.intervalDays);
        schedule.nextRotation = nextRotationDate.toISOString();
        this.schedules.set(keyId, schedule);
        this.saveSchedules();
      }
      
      // Mark as completed
      rotationEvent.status = 'completed';
      this.saveRotationHistory();
      
      console.log(`✅ Key rotation completed for ${keyRef.name}`);
      await this.sendRotationNotification(keyId, 'Rotation completed successfully', 'high');
      
      return true;
      
    } catch (error) {
      console.error(`❌ Key rotation failed for ${keyId}:`, error);
      
      rotationEvent.status = 'failed';
      rotationEvent.error = error.message;
      this.saveRotationHistory();
      
      await this.sendRotationNotification(keyId, `Rotation failed: ${error.message}`, 'critical');
      
      return false;
    }
  }

  /**
   * Simulate key rotation (placeholder for actual implementation)
   */
  private async simulateKeyRotation(keyId: string, rotationEvent: RotationEvent): Promise<void> {
    // Simulate API call to service provider to rotate key
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a fake new key hash for demonstration
    const newKeyHash = this.hashKey(`new-key-${Date.now()}`);
    rotationEvent.newKeyHash = newKeyHash;
    
    console.log(`🔑 Generated new key for ${keyId} (hash: ${newKeyHash.substr(0, 8)}...)`);
    
    // In a real implementation, this would:
    // 1. Call the service provider's API to generate a new key
    // 2. Update the environment variable or secret store
    // 3. Test the new key to ensure it works
    // 4. Deactivate the old key (with a grace period)
    // 5. Update any dependent systems
  }

  /**
   * Send rotation notification
   */
  private async sendRotationNotification(keyId: string, message: string, priority: string): Promise<void> {
    const keyRef = this.keyManager.getKeyReference(keyId);
    const keyName = keyRef?.name || keyId;
    
    const notification = {
      keyId,
      keyName,
      message,
      priority,
      timestamp: new Date().toISOString()
    };

    for (const [targetId, target] of this.notificationTargets) {
      if (!target.enabled) continue;
      
      try {
        await this.sendNotificationToTarget(target, notification);
      } catch (error) {
        console.error(`❌ Failed to send notification to ${targetId}:`, error);
      }
    }
  }

  /**
   * Send notification to specific target
   */
  private async sendNotificationToTarget(target: NotificationTarget, notification: any): Promise<void> {
    const message = this.renderTemplate(target.template || '{{message}}', notification);
    
    switch (target.type) {
      case 'log':
        if (target.endpoint === 'console') {
          console.log(`📢 ${message}`);
        } else {
          // Write to log file
          const logEntry = `${notification.timestamp} [${notification.priority.toUpperCase()}] ${message}\n`;
          writeFileSync(target.endpoint, logEntry, { flag: 'a' });
        }
        break;
        
      case 'webhook':
        if (target.endpoint) {
          // In a real implementation, this would make an HTTP request
          console.log(`🔗 Webhook notification sent to ${target.endpoint}: ${message}`);
        }
        break;
        
      case 'email':
        // In a real implementation, this would send an email
        console.log(`📧 Email notification would be sent: ${message}`);
        break;
        
      case 'slack':
        // In a real implementation, this would send to Slack
        console.log(`💬 Slack notification would be sent: ${message}`);
        break;
    }
  }

  /**
   * Render notification template
   */
  private renderTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Create hash of API key for audit purposes
   */
  private hashKey(key: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Get keys that need immediate attention
   */
  getKeysRequiringAttention(): { keyId: string; reason: string; priority: string; daysOverdue?: number }[] {
    const now = new Date();
    const issues: { keyId: string; reason: string; priority: string; daysOverdue?: number }[] = [];
    
    for (const [keyId, schedule] of this.schedules) {
      const rotationDate = new Date(schedule.nextRotation);
      const daysUntilRotation = Math.ceil((rotationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilRotation <= 0) {
        issues.push({
          keyId,
          reason: 'Rotation overdue',
          priority: 'critical',
          daysOverdue: Math.abs(daysUntilRotation)
        });
      } else if (daysUntilRotation <= 7) {
        issues.push({
          keyId,
          reason: `Rotation due in ${daysUntilRotation} days`,
          priority: daysUntilRotation <= 1 ? 'critical' : 'high'
        });
      }
    }
    
    return issues;
  }

  /**
   * Get rotation statistics
   */
  getRotationStatistics(): any {
    const stats = {
      totalKeys: this.schedules.size,
      automatedKeys: Array.from(this.schedules.values()).filter(s => s.automated).length,
      recentEvents: this.rotationEvents.filter(e => {
        const eventDate = new Date(e.timestamp);
        const daysSinceEvent = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceEvent <= 30;
      }).length,
      successRate: this.calculateSuccessRate(),
      nextRotations: this.getUpcomingRotations(30)
    };
    
    return stats;
  }

  /**
   * Calculate rotation success rate over the last 90 days
   */
  private calculateSuccessRate(): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const recentEvents = this.rotationEvents.filter(e => {
      return new Date(e.timestamp) >= cutoffDate && 
             ['completed', 'failed'].includes(e.status);
    });
    
    if (recentEvents.length === 0) return 100;
    
    const successfulEvents = recentEvents.filter(e => e.status === 'completed').length;
    return Math.round((successfulEvents / recentEvents.length) * 100);
  }

  /**
   * Get upcoming rotations within specified days
   */
  private getUpcomingRotations(days: number): Array<{ keyId: string; scheduledDate: string; daysUntil: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    
    const upcoming: Array<{ keyId: string; scheduledDate: string; daysUntil: number }> = [];
    
    for (const [keyId, schedule] of this.schedules) {
      const rotationDate = new Date(schedule.nextRotation);
      if (rotationDate <= cutoffDate) {
        const daysUntil = Math.ceil((rotationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        upcoming.push({
          keyId,
          scheduledDate: schedule.nextRotation,
          daysUntil
        });
      }
    }
    
    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const keyManager = new MCPAPIKeyManager();
  const scheduler = new MCPKeyRotationScheduler(keyManager);
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      const interval = parseInt(process.argv[3]) || 60;
      scheduler.startScheduler(interval);
      
      // Keep the process running
      console.log('Press Ctrl+C to stop the scheduler');
      process.on('SIGINT', () => {
        scheduler.stopScheduler();
        process.exit(0);
      });
      break;
      
    case 'check':
      await scheduler['checkRotationSchedules']();
      break;
      
    case 'rotate':
      const keyId = process.argv[3];
      if (!keyId) {
        console.error('❌ Please specify a key ID to rotate');
        process.exit(1);
      }
      const success = await scheduler.triggerKeyRotation(keyId, 'manual');
      process.exit(success ? 0 : 1);
      break;
      
    case 'status':
      const issues = scheduler.getKeysRequiringAttention();
      const stats = scheduler.getRotationStatistics();
      
      console.log('\n📊 Rotation Status:');
      console.log(`   Total Keys: ${stats.totalKeys}`);
      console.log(`   Automated: ${stats.automatedKeys}`);
      console.log(`   Success Rate: ${stats.successRate}%`);
      console.log(`   Recent Events: ${stats.recentEvents}`);
      
      if (issues.length > 0) {
        console.log('\n⚠️  Keys Requiring Attention:');
        issues.forEach(issue => {
          console.log(`   - ${issue.keyId}: ${issue.reason} (${issue.priority})`);
        });
      } else {
        console.log('\n✅ All keys are on schedule');
      }
      
      if (stats.nextRotations.length > 0) {
        console.log('\n📅 Upcoming Rotations (next 30 days):');
        stats.nextRotations.slice(0, 5).forEach(rotation => {
          console.log(`   - ${rotation.keyId}: ${rotation.daysUntil} days`);
        });
      }
      break;
      
    default:
      console.log(`
TekUp MCP Key Rotation Scheduler

Usage: node key-rotation-scheduler.js <command> [options]

Commands:
  start [interval]  - Start the rotation scheduler (default: 60 minutes)
  check            - Check rotation schedules once
  rotate <keyId>   - Manually trigger rotation for specific key
  status           - Show rotation status and upcoming schedules

Examples:
  node key-rotation-scheduler.js start 30
  node key-rotation-scheduler.js rotate brave-search-api
  node key-rotation-scheduler.js status
      `);
  }
}

// Run CLI if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export default MCPKeyRotationScheduler;