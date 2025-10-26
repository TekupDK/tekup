/**
 * Main IPC handlers that bridge preload API to services
 */

import { ipcMain } from 'electron'
import { AppServiceManager } from '../AppServiceManager'
import { LogService } from '../services/LogService'
import { EmailAccount, AIProvider, AppSettings } from '@shared/types'

export class IPCHandlerManager {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-main-ipc-han');

  private log: LogService
  private serviceManager: AppServiceManager

  constructor(serviceManager: AppServiceManager) {
    this.serviceManager = serviceManager
    this.log = new LogService()
  }

  /**
   * Register all IPC handlers
   */
  registerHandlers(): void {
    this.log.info('Registering IPC handlers')

    // Email operations
    this.registerEmailHandlers()
    
    // AI operations  
    this.registerAIHandlers()
    
    // Configuration operations
    this.registerConfigHandlers()
    
    // Application operations
    this.registerAppHandlers()
    // registerProjectXHandlers() removed - using flow: namespace only
  this.registerFlowIngestionHandlers()

    this.log.info('All IPC handlers registered successfully')
  }

  /**
   * Email operation handlers
   */
  private registerEmailHandlers(): void {
    ipcMain.handle('email:addAccount', async (event, config: EmailAccount) => {
      try {
        this.log.debug('Adding email account', { accountId: config.id })
        const services = this.serviceManager.getServices()
        // TODO: Implement email service - currently using config service as placeholder
        return await services.config?.saveEmailAccount(config)
      } catch (error) {
        this.log.error('Failed to add email account', error as Error)
        throw error
      }
    })

    ipcMain.handle('email:removeAccount', async (event, accountId: string) => {
      try {
        this.log.debug('Removing email account', { accountId })
        const emailService = this.serviceManager.getEmailService()
        if (!emailService) {
          throw new Error('Email service not available')
        }
        return await emailService.removeAccount(accountId)
      } catch (error) {
        this.log.error('Failed to remove email account', error as Error)
        throw error
      }
    })

    ipcMain.handle('sync-emails', async (event, accountId) => {
      try {
        const emailService = this.serviceManager.getEmailService()
        if (!emailService) {
          throw new Error('Email service not available')
        }
        return await emailService.syncEmails(accountId)
      } catch (error) {
        this.log.error('Failed to sync emails', error as Error)
        throw error
      }
    })

    ipcMain.handle('get-email', async (event, emailId) => {
      try {
        const emailService = this.serviceManager.getEmailService()
        if (!emailService) {
          throw new Error('Email service not available')
        }
        return await emailService.getEmail(emailId)
      } catch (error) {
        this.log.error('Failed to get email', error as Error)
        throw error
      }
    })

    ipcMain.handle('get-emails', async (event, accountId, options) => {
      try {
        const emailService = this.serviceManager.getEmailService()
        if (!emailService) {
          throw new Error('Email service not available')
        }
        return await emailService.getEmails(accountId, options)
      } catch (error) {
        this.log.error('Failed to get emails', error as Error)
        throw error
      }
    })

    ipcMain.handle('search-emails', async (event, accountId, query) => {
      try {
        const emailService = this.serviceManager.getEmailService()
        if (!emailService) {
          throw new Error('Email service not available')
        }
        return await emailService.searchEmails(query)
      } catch (error) {
        this.log.error('Failed to search emails', error as Error)
        throw error
      }
    })

    ipcMain.handle('email:getFolders', async (event, accountId: string) => {
      try {
        const emailService = this.serviceManager.getEmailService()
        if (!emailService) {
          throw new Error('Email service not available')
        }
        return await emailService.getFolders(accountId)
      } catch (error) {
        this.log.error('Failed to get folders', error as Error)
        throw error
      }
    })

    ipcMain.handle('email:action', async (event, action: any) => {
      try {
        const emailService = this.serviceManager.getEmailService()
        if (!emailService) {
          throw new Error('Email service not available')
        }
        return await emailService.performAction(action)
      } catch (error) {
        this.log.error('Failed to perform email action', error as Error)
        throw error
      }
    })
  }

  /**
   * AI operation handlers
   */
  private registerAIHandlers(): void {
    ipcMain.handle('ai:summarize', async (event, email: any) => {
      try {
        this.log.debug('Summarizing email', { emailId: email.id })
        const aiService = this.serviceManager.getAIService()
        if (!aiService) {
          throw new Error('AI service not available')
        }
        return await aiService.summarizeEmail(email)
      } catch (error) {
        this.log.error('Failed to compose reply', error as Error)
        throw error
      }
    })

    ipcMain.handle('ai:summarize', async (event, emailId) => {
      try {
        const aiService = this.serviceManager.getAIService()
        if (!aiService) {
          throw new Error('AI service not available')
        }
        return await aiService.summarizeEmail(emailId)
      } catch (error) {
        this.log.error('Failed to categorize email', error as Error)
        throw error
      }
    })

    ipcMain.handle('ai:categorize', async (event, email: any) => {
      try {
        const aiService = this.serviceManager.getAIService()
        if (!aiService) {
          throw new Error('AI service not available')
        }
        return await aiService.categorizeEmail(email)
      } catch (error) {
        this.log.error('Failed to categorize email', error as Error)
        throw error
      }
    })

    ipcMain.handle('ai:generateDraft', async (event, prompt: string, context?: any) => {
      try {
        const aiService = this.serviceManager.getAIService()
        if (!aiService) {
          throw new Error('AI service not available')
        }
        return await aiService.generateDraft(prompt, context)
      } catch (error) {
        this.log.error('Failed to generate draft', error as Error)
        throw error
      }
    })

    ipcMain.handle('ai:extract-lead', async (event, emailId) => {
      try {
        const aiService = this.serviceManager.getAIService()
        if (!aiService) {
          throw new Error('AI service not available')
        }
        return await aiService.extractLead(emailId)
      } catch (error) {
        this.log.error('Failed to extract action items', error as Error)
        throw error
      }
    })

    ipcMain.handle('ai:getStatus', async (event) => {
      try {
        const aiService = this.serviceManager.getAIService()
        if (!aiService) {
          throw new Error('AI service not available')
        }
        return await aiService.getStatus()
      } catch (error) {
        this.log.error('Failed to get AI status', error as Error)
        throw error
      }
    })

    ipcMain.handle('ai:switch-provider', async (event, providerId) => {
      try {
        const aiService = this.serviceManager.getAIService()
        if (!aiService) {
          throw new Error('AI service not available')
        }
        return await aiService.switchProvider(providerId)
      } catch (error) {
        this.log.error('Failed to switch AI provider', error as Error)
        throw error
      }
    })
  }

  /**
   * Configuration operation handlers
   */
  private registerConfigHandlers(): void {
    ipcMain.handle('save-email-account', async (event, account) => {
      try {
        const configService = this.serviceManager.getConfigurationService()
        if (!configService) {
          throw new Error('Configuration service not available')
        }
        return await configService.saveEmailAccount(account)
      } catch (error) {
        this.log.error('Failed to save email account', error as Error)
        throw error
      }
    })

    ipcMain.handle('config:getEmailAccounts', async (event) => {
      try {
        const configService = this.serviceManager.getConfigurationService()
        if (!configService) {
          throw new Error('Configuration service not available')
        }
        return await configService.getEmailAccounts()
      } catch (error) {
        this.log.error('Failed to get email accounts', error as Error)
        throw error
      }
    })

    ipcMain.handle('config:getEmailAccount', async (event, id) => {
      try {
        const configService = this.serviceManager.getConfigurationService()
        if (!configService) {
          throw new Error('Configuration service not available')
        }
        return await configService.getEmailAccount(id)
      } catch (error) {
        this.log.error('Failed to get email account', error as Error)
        throw error
      }
    })

    ipcMain.handle('config:saveEmailAccount', async (event, account) => {
      try {
        const configService = this.serviceManager.getConfigurationService()
        if (!configService) {
          throw new Error('Configuration service not available')
        }
        return await configService.saveEmailAccount(account)
      } catch (error) {
        this.log.error('Failed to save email account', error as Error)
        throw error
      }
    })

    ipcMain.handle('config:updateEmailAccount', async (event, id, updates) => {
      try {
        const configService = this.serviceManager.getConfigurationService()
        if (!configService) {
          throw new Error('Configuration service not available')
        }
        return await configService.updateEmailAccount(id, updates)
      } catch (error) {
        this.log.error('Failed to update email account', error as Error)
        throw error
      }
    })

    ipcMain.handle('config:deleteEmailAccount', async (event, id) => {
      try {
        const configService = this.serviceManager.getConfigurationService()
        if (!configService) {
          throw new Error('Configuration service not available')
        }
        return await configService.deleteEmailAccount(id)
      } catch (error) {
        this.log.error('Failed to delete email account', error as Error)
        throw error
      }
    })

    ipcMain.handle('test-email-connection', async (event, config) => {
      try {
        const configService = this.serviceManager.getConfigurationService()
        if (!configService) {
          throw new Error('Configuration service not available')
        }
        return await configService.testEmailConnection(config)
      } catch (error) {
        logger.error('Test email connection failed:', error)
        throw error
      }
    })

    ipcMain.handle('config:importConfig', async (event, data) => {
      try {
        const configService = this.serviceManager.getConfigurationService()
        if (!configService) {
          throw new Error('Configuration service not available')
        }
        return await configService.importConfig(data)
      } catch (error) {
        this.log.error('Failed to import config', error as Error)
        throw error
      }
    })

    ipcMain.handle('config:exportConfig', async (event) => {
      try {
        const configService = this.serviceManager.getConfigurationService()
        if (!configService) {
          throw new Error('Configuration service not available')
        }
        return await configService.exportConfig()
      } catch (error) {
        this.log.error('Failed to export config', error as Error)
        throw error
      }
    })
  }

  /**
   * Application operation handlers
   */
  private registerAppHandlers(): void {
    ipcMain.handle('app:getInfo', async (event) => {
      try {
        return {
          version: process.env.npm_package_version || '1.0.0',
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          electronVersion: process.versions.electron,
          isDev: process.env.NODE_ENV === 'development'
        }
      } catch (error) {
        this.log.error('Failed to get app info', error as Error)
        throw error
      }
    })

    ipcMain.handle('app:getLogs', async (event, options?: any) => {
      try {
        return await this.log.getLogs(options)
      } catch (error) {
        this.log.error('Failed to get logs', error as Error)
        throw error
      }
    })

    ipcMain.handle('app:clearLogs', async (event) => {
      try {
        return await this.log.clearLogs()
      } catch (error) {
        this.log.error('Failed to clear logs', error as Error)
        throw error
      }
    })

    ipcMain.handle('app:logError', async (event, error: any) => {
      try {
        this.log.error('Frontend error', new Error(error.message), error)
      } catch (logError) {
        logger.error('Failed to log frontend error:', logError)
      }
    })

    ipcMain.handle('app:restart', async (event) => {
      try {
        const { app } = require('electron')
        app.relaunch()
        app.exit(0)
      } catch (error) {
        this.log.error('Failed to restart app', error as Error)
        throw error
      }
    })

    ipcMain.handle('app:checkUpdates', async (event) => {
      try {
        // Placeholder for auto-updater integration
        return { hasUpdate: false, version: null }
      } catch (error) {
        this.log.error('Failed to check updates', error as Error)
        throw error
      }
    })
  }

  // registerProjectXHandlers removed - legacy projectx: namespace deprecated

  /**
   * Flow Ingestion integration handlers (new canonical namespace)
   */
  private registerFlowIngestionHandlers(): void {
    ipcMain.handle('flow:forwardLead', async (event, lead, emailId, tenantId) => {
      try {
        const flowService = this.serviceManager.getFlowIngestionService()
        if (!flowService) throw new Error('Flow Ingestion service not available')
        return await flowService.forwardLead(lead, emailId, tenantId)
      } catch (error) {
        this.log.error('Failed to forward lead to Flow', error as Error)
        throw error
      }
    })

    ipcMain.handle('flow:forwardComplianceFinding', async (event, finding, tenantId) => {
      try {
        const flowService = this.serviceManager.getFlowIngestionService()
        if (!flowService) throw new Error('Flow Ingestion service not available')
        return await flowService.forwardComplianceFinding(finding, tenantId)
      } catch (error) {
        this.log.error('Failed to forward compliance finding to Flow', error as Error)
        throw error
      }
    })

    ipcMain.handle('flow:configureTenantMapping', async (event, tenantKey, flowTenant) => {
      try {
        const flowService = this.serviceManager.getFlowIngestionService()
        if (!flowService) throw new Error('Flow Ingestion service not available')
        return await flowService.configureTenantMapping(tenantKey, flowTenant)
      } catch (error) {
        this.log.error('Failed to configure Flow tenant mapping', error as Error)
        throw error
      }
    })

    ipcMain.handle('flow:testConnection', async () => {
      try {
        const flowService = this.serviceManager.getFlowIngestionService()
        if (!flowService) throw new Error('Flow Ingestion service not available')
        return await flowService.testConnection()
      } catch (error) {
        this.log.error('Failed to test Flow connection', error as Error)
        throw error
      }
    })

    ipcMain.handle('flow:convertComplianceFindings', async (event, findings, tenantId) => {
      try {
        const flowService = this.serviceManager.getFlowIngestionService()
        if (!flowService) throw new Error('Flow Ingestion service not available')
        return await flowService.convertComplianceFindingsToLeads(findings, tenantId)
      } catch (error) {
        this.log.error('Failed to convert compliance findings (Flow)', error as Error)
        throw error
      }
    })
  }

  /**
   * Unregister all handlers (for cleanup)
   */
  unregisterHandlers(): void {
    // Remove all registered handlers
    const handlers = [
      // Email handlers
      'email:addAccount', 'email:removeAccount', 'email:sync', 'email:getEmails',
      'email:getEmail', 'email:getFolders', 'email:search', 'email:action',
      
      // AI handlers
      'ai:summarize', 'ai:composeReply', 'ai:categorize', 'ai:generateDraft',
      'ai:extractActionItems', 'ai:getStatus', 'ai:switchProvider',

  // Flow ingestion handlers (new)
  'flow:forwardLead', 'flow:forwardComplianceFinding', 'flow:configureTenantMapping',
  'flow:testConnection', 'flow:convertComplianceFindings',
      
      // Config handlers
      'config:getEmailAccounts', 'config:saveEmailAccount', 'config:updateEmailAccount',
      'config:deleteEmailAccount', 'config:testEmailConnection', 'config:getAIProviders',
      'config:saveAIProvider', 'config:deleteAIProvider', 'config:getAppSettings',
      'config:updateAppSettings', 'config:import', 'config:export',
      
      // App handlers
      'app:getInfo', 'app:getLogs', 'app:clearLogs', 'app:logError',
      'app:restart', 'app:checkUpdates'
    ]

    handlers.forEach(handler => {
      ipcMain.removeHandler(handler)
    })

    this.log.info('All IPC handlers unregistered')
  }
}
