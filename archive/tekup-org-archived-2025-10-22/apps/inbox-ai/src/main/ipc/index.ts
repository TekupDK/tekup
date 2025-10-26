/**
 * Main IPC handlers setup and orchestration
 */

import { setupConfigHandlers, ConfigHandlersContext } from './configHandlers.js'
import { ipcMain } from 'electron'
import { LogService } from '../services/LogService.js'

// Service container interface
export interface ServiceContainer {
  // Core services
  logService: LogService
  validationService: any
  errorHandlingService: any
  configurationService: any
  
  // Email services
  imapService: any
  emailOperationsService: any
  emailSyncService: any
  
  // AI services
  aiServiceManager: any
  emailProcessingService: any
  
  // Repositories
  accountRepository: any
}

/**
 * Setup all IPC handlers with service dependencies
 */
export function setupIPCHandlers(services: ServiceContainer): void {
  const { logService } = services
  
  try {
    logService.info('Setting up TekUp Secure Platform IPC handlers')

    // Setup configuration handlers (minimal for TekUp platform)
    const configContext: ConfigHandlersContext = {
      configurationService: services.configurationService,
      accountRepository: services.accountRepository,
      logService: services.logService,
      validationService: services.validationService,
      errorHandlingService: services.errorHandlingService
    }
    setupConfigHandlers(configContext)

    // Setup general app handlers
    setupAppHandlers(services)

    logService.info('TekUp Secure Platform IPC handlers registered successfully (minimal set)')
  } catch (error) {
    logService.error('Failed to setup IPC handlers', error as Error)
    throw error
  }
}

/**
 * Setup general application IPC handlers
 */
function setupAppHandlers(services: ServiceContainer): void {
  const { logService } = services

  /**
   * Get application info
   */
  ipcMain.handle('app:getInfo', async () => {
    try {
      const { app } = await import('electron')
      return {
        name: app.getName(),
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    } catch (error) {
      logService.error('Failed to get app info', error as Error)
      throw error
    }
  })

  /**
   * Get app logs
   */
  ipcMain.handle('app:getLogs', async (event, options?: { level?: string; limit?: number }) => {
    try {
      // This would get logs from the log service
      const logs = await logService.getLogs(options?.level || 'info')
      return logs
    } catch (error) {
      logService.error('Failed to get app logs', error as Error)
      throw error
    }
  })

  /**
   * Clear app logs
   */
  ipcMain.handle('app:clearLogs', async () => {
    try {
      await logService.clearLogs()
      logService.info('Application logs cleared')
      return true
    } catch (error) {
      logService.error('Failed to clear app logs', error as Error)
      throw error
    }
  })

  /**
   * Restart application
   */
  ipcMain.handle('app:restart', async () => {
    try {
      const { app } = await import('electron')
      logService.info('Restarting application')
      app.relaunch()
      app.exit()
    } catch (error) {
      logService.error('Failed to restart app', error as Error)
      throw error
    }
  })

  /**
   * Check for updates (placeholder for future implementation)
   */
  ipcMain.handle('app:checkUpdates', async () => {
    try {
      logService.info('Checking for updates')
      
      // Placeholder - would integrate with electron-updater
      return {
        available: false,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0'
      }
    } catch (error) {
      logService.error('Failed to check for updates', error as Error)
      throw error
    }
  })

  logService.info('Application IPC handlers registered successfully')
}

/**
 * Remove all IPC handlers (useful for cleanup/testing)
 */
export function removeAllIPCHandlers(): void {
  ipcMain.removeAllListeners()
}