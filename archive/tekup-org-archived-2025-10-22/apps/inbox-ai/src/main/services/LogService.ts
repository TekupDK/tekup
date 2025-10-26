/**
 * Logging service for AI IMAP Inbox
 */

import { join } from 'path'
import { app } from 'electron'
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs'

export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  meta?: any
  error?: Error
}

export class LogService {
  private logDir: string
  private logFile: string
  private maxLogSize: number = 10 * 1024 * 1024 // 10MB
  private maxLogFiles: number = 5

  constructor() {
    this.logDir = join(app.getPath('userData'), 'logs')
    this.logFile = join(this.logDir, 'app.log')
    this.ensureLogDirectory()
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }
  }

  private formatLogEntry(level: string, message: string, meta?: any, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: level as any,
      message,
      meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any : undefined,
    }
  }

  private writeLog(entry: LogEntry): void {
    const logLine = JSON.stringify(entry) + '\n'
    
    try {
      appendFileSync(this.logFile, logLine)
      
      // Check if log rotation is needed
      this.rotateLogIfNeeded()
    } catch (error) {
      logger.error('Failed to write to log file:', error)
    }
  }

  private rotateLogIfNeeded(): void {
    try {
      const fs = require('fs')
      const stats = fs.statSync(this.logFile)
      
      if (stats.size > this.maxLogSize) {
        // Rotate logs
        for (let i = this.maxLogFiles - 1; i >= 1; i--) {
          const oldFile = `${this.logFile}.${i}`
          const newFile = `${this.logFile}.${i + 1}`
          
          if (existsSync(oldFile)) {
            if (i === this.maxLogFiles - 1) {
              fs.unlinkSync(oldFile) // Delete oldest
            } else {
              fs.renameSync(oldFile, newFile)
            }
          }
        }
        
        // Move current log to .1
        fs.renameSync(this.logFile, `${this.logFile}.1`)
      }
    } catch (error) {
      logger.error('Failed to rotate log files:', error)
    }
  }

  debug(message: string, meta?: any): void {
    const entry = this.formatLogEntry('debug', message, meta)
    logger.debug(`[DEBUG] ${message}`, meta)
    this.writeLog(entry)
  }

  info(message: string, meta?: any): void {
    const entry = this.formatLogEntry('info', message, meta)
    logger.info(`[INFO] ${message}`, meta)
    this.writeLog(entry)
  }

  warn(message: string, meta?: any): void {
    const entry = this.formatLogEntry('warn', message, meta)
    logger.warn(`[WARN] ${message}`, meta)
    this.writeLog(entry)
  }

  error(message: string, error?: Error, meta?: any): void {
    const entry = this.formatLogEntry('error', message, meta, error)
    logger.error(`[ERROR] ${message}`, error, meta)
    this.writeLog(entry)
  }

  async getLogs(level?: string, limit: number = 100): Promise<LogEntry[]> {
    try {
      const fs = require('fs')
      const logs: LogEntry[] = []
      
      if (!existsSync(this.logFile)) {
        return logs
      }

      const content = fs.readFileSync(this.logFile, 'utf8')
      const lines = content.trim().split('\n').filter((line: string) => line.length > 0)
      
      for (const line of lines.slice(-limit)) {
        try {
          const entry = JSON.parse(line) as LogEntry
          if (!level || entry.level === level) {
            logs.push(entry)
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
      
      return logs.reverse() // Most recent first
    } catch (error) {
      logger.error('Failed to read logs:', error)
      return []
    }
  }

  async clearLogs(olderThan?: Date): Promise<number> {
    try {
      const fs = require('fs')
      
      if (!olderThan) {
        // Clear all logs
        if (existsSync(this.logFile)) {
          fs.unlinkSync(this.logFile)
          return 1
        }
        return 0
      }

      // Clear logs older than specified date
      const logs = await this.getLogs()
      const filteredLogs = logs.filter(log => new Date(log.timestamp) >= olderThan)
      
      // Rewrite log file with filtered logs
      const content = filteredLogs
        .reverse()
        .map(log => JSON.stringify(log))
        .join('\n') + '\n'
      
      writeFileSync(this.logFile, content)
      
      return logs.length - filteredLogs.length
    } catch (error) {
      logger.error('Failed to clear logs:', error)
      return 0
    }
  }

  async exportLogs(): Promise<string> {
    try {
      const fs = require('fs')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const exportFile = join(this.logDir, `logs-export-${timestamp}.json`)
      
      const logs = await this.getLogs()
      const exportData = {
        exportedAt: new Date().toISOString(),
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-main-service');

        version: app.getVersion(),
        platform: process.platform,
        logs,
      }
      
      fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2))
      
      return exportFile
    } catch (error) {
      logger.error('Failed to export logs:', error)
      throw error
    }
  }
}