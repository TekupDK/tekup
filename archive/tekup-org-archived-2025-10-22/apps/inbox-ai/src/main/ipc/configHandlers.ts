/**
 * IPC handlers for configuration operations
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { ConfigurationServiceImpl } from '../services/ConfigurationService.js'
import { AccountRepositoryImpl } from '../repositories/AccountRepository.js'
import { LogService } from '../services/LogService.js'
import { ValidationService } from '../services/ValidationService.js'
import { ErrorHandlingService } from '../services/ErrorHandlingService.js'
import { IMAPConfig, EmailAccount, AIProvider, AppSettings } from '@shared/types'

export interface ConfigHandlersContext {
  configurationService: ConfigurationServiceImpl
  accountRepository: AccountRepositoryImpl
  logService: LogService
  validationService: ValidationService
  errorHandlingService: ErrorHandlingService
}

export function setupConfigHandlers(context: ConfigHandlersContext): void {
  const { 
    configurationService, 
    accountRepository, 
    logService, 
    validationService, 
    errorHandlingService 
  } = context

  /**
   * Get all email accounts
   */
  ipcMain.handle('config:getEmailAccounts', async (event: IpcMainInvokeEvent) => {
    try {
      logService.info('Getting email accounts')
      
      const accounts = await accountRepository.getAccounts()
      
      // Remove sensitive data from response
      const sanitizedAccounts = accounts.map((account: EmailAccount) => ({
        ...account,
        password: undefined, // Don't send passwords to renderer
        accessToken: undefined
      }))
      
      logService.info('Retrieved email accounts', { count: sanitizedAccounts.length })
      return sanitizedAccounts
    } catch (error) {
      const handledError = errorHandlingService.handleError(error as Error, 'config:getEmailAccounts')
      logService.error('Failed to get email accounts', handledError)
      throw handledError
    }
  })

  /**
   * Save email account configuration
   */
  ipcMain.handle('config:saveEmailAccount', async (event: IpcMainInvokeEvent, config: IMAPConfig) => {
    try {
      logService.info('Saving email account', { 
        host: config.host, 
        username: config.username,
        provider: config.provider 
      })
      
      // Validate configuration
      const validationResult = validationService.validateIMAPConfig(config)
      if (!validationResult.isValid) {
        throw new Error(`Invalid IMAP configuration: ${validationResult.errors.join(', ')}`)
      }

      const account = await accountRepository.createAccount(config)
      
      // Return sanitized account (without sensitive data)
      const sanitizedAccount = {
        ...account,
        password: undefined,
        accessToken: undefined
      }
      
      logService.info('Email account saved successfully', { accountId: account.id })
      return sanitizedAccount
    } catch (error) {
      const handledError = errorHandlingService.handleError(error as Error, 'config:saveEmailAccount')
      logService.error('Failed to save email account', handledError, { 
        config: { ...config, password: '[REDACTED]' } 
      })
      throw handledError
    }
  })

  /**
   * Update email account configuration
   */
  ipcMain.handle('config:updateEmailAccount', async (event: IpcMainInvokeEvent, accountId: string, updates: Partial<IMAPConfig>) => {
    try {
      logService.info('Updating email account', { accountId, updates: Object.keys(updates) })
      
      // If password is being updated, validate the full config
      if (updates.password || updates.username || updates.host) {
        const existingAccount = await accountRepository.getAccount(accountId)
        if (!existingAccount) {
          throw new Error(`Account not found: ${accountId}`)
        }

        const mergedConfig = { ...existingAccount, ...updates }
        const validationResult = validationService.validateIMAPConfig(mergedConfig)
        if (!validationResult.isValid) {
          throw new Error(`Invalid IMAP configuration: ${validationResult.errors.join(', ')}`)
        }
      }

      const updatedAccount = await accountRepository.updateAccount(accountId, updates)
      
      // Return sanitized account
      const sanitizedAccount = {
        ...updatedAccount,
        password: undefined,
        accessToken: undefined
      }
      
      logService.info('Email account updated successfully', { accountId })
      return sanitizedAccount
    } catch (error) {
      const handledError = errorHandlingService.handleError(error as Error, 'config:updateEmailAccount')
      logService.error('Failed to update email account', handledError, { accountId, updates })
      throw handledError
    }
  })

  /**
   * Delete email account
   */
  ipcMain.handle('config:deleteEmailAccount', async (event: IpcMainInvokeEvent, accountId: string) => {
    try {
      logService.info('Deleting email account', { accountId })
      
      const result = await accountRepository.deleteAccount(accountId)
      
      logService.info('Email account deleted successfully', { accountId })
      return result
    } catch (error) {
      const handledError = errorHandlingService.handleError(error as Error, 'config:deleteEmailAccount')
      logService.error('Failed to delete email account', handledError, { accountId })
      throw handledError
    }
  })

  /**
   * Get AI providers
   */
  ipcMain.handle('config:getAIProviders', async (event: IpcMainInvokeEvent) => {
    try {
      logService.info('Getting AI providers')
      
      const providers = await configurationService.getAIProviders()
      
      // Remove sensitive API keys from response
      const sanitizedProviders = providers.map(provider => ({
        ...provider,
        apiKey: provider.apiKey ? '[CONFIGURED]' : undefined
      }))
      
      logService.info('Retrieved AI providers', { count: sanitizedProviders.length })
      return sanitizedProviders
    } catch (error) {
      const handledError = errorHandlingService.handleError(error as Error, 'config:getAIProviders')
      logService.error('Failed to get AI providers', handledError)
      throw handledError
    }
  })

  /**
   * Save AI provider configuration
   */
  ipcMain.handle('config:saveAIProvider', async (event: IpcMainInvokeEvent, provider: AIProvider) => {
    try {
      logService.info('Saving AI provider', { 
        providerId: provider.id, 
        type: provider.type,
        name: provider.name 
      })
      
      // Validate provider configuration
      const validationResult = validationService.validateAIProvider(provider)
      if (!validationResult.isValid) {
        throw new Error(`Invalid AI provider configuration: ${validationResult.errors.join(', ')}`)
      }

      const savedProvider = await configurationService.saveAIProvider(provider)
      
      // Return sanitized provider (without API key)
      const sanitizedProvider = {
        ...savedProvider,
        apiKey: savedProvider.apiKey ? '[CONFIGURED]' : undefined
      }
      
      logService.info('AI provider saved successfully', { providerId: provider.id })
      return sanitizedProvider
    } catch (error) {
      const handledError = errorHandlingService.handleError(error as Error, 'config:saveAIProvider')
      logService.error('Failed to save AI provider', handledError, { 
        provider: { ...provider, apiKey: '[REDACTED]' } 
      })
      throw handledError
    }
  })

  /**
   * Delete AI provider
   */
  ipcMain.handle('config:deleteAIProvider', async (event: IpcMainInvokeEvent, providerId: string) => {
    try {
      logService.info('Deleting AI provider', { providerId })
      
      const result = await configurationService.deleteAIProvider(providerId)
      
      logService.info('AI provider deleted successfully', { providerId })
      return result
    } catch (error) {
      const handledError = errorHandlingService.handleError(error as Error, 'config:deleteAIProvider')
      logService.error('Failed to delete AI provider', handledError, { providerId })
      throw handledError
    }
  })

  /**
   * Get application settings
   */
  ipcMain.handle('config:getAppSettings', async (event: IpcMainInvokeEvent) => {
    try {
      logService.info('Getting application settings')
      
      const settings = await configurationService.getAppSettings()
      
      logService.info('Retrieved application settings')
      return settings
    } catch (error) {
      const handledError = errorHandlingService.handleError(error as Error, 'config:getAppSettings')
      logService.error('Failed to get application settings', handledError)
      throw handledError
    }
  })

  /**
   * Update application settings
   */
  ipcMain.handle('config:updateAppSettings', async (event: IpcMainInvokeEvent, settings: Partial<AppSettings>) => {
    try {
      logService.info('Updating application settings', { settings: Object.keys(settings) })
      
      // Validate settings
      const validationResult = validationService.validateAppSettings(settings)
      if (!validationResult.isValid) {
        throw new Error(`Invalid application settings: ${validationResult.errors.join(', ')}`)
      }

      const updatedSettings = await configurationService.updateAppSettings(settings)
      
      logService.info('Application settings updated successfully')
      return updatedSettings
    } catch (error) {
      const handledError = errorHandlingService.handleError(error as Error, 'config:updateAppSettings')
      logService.error('Failed to update application settings', handledError, { settings })
      throw handledError
    }
  })

  /**
   * Test email account connection
   */
  ipcMain.handle('config:testEmailConnection', async (event: IpcMainInvokeEvent, config: IMAPConfig) => {
    try {
      logService.info('Testing email connection', { 
        host: config.host, 
        username: config.username,
        provider: config.provider 
      })
      
      // Validate configuration first
      const validationResult = validationService.validateIMAPConfig(config)
      if (!validationResult.isValid) {
        throw new Error(`Invalid IMAP configuration: ${validationResult.errors.join(', ')}`)
      }

      // Test connection (this would be implemented in IMAPService)
      // Validate IMAP configuration through config service
      const isValid = await configurationService.validateIMAPConfig(config)
      
      logService.info('Email connection test completed', { 
        success: isValid,
        host: config.host 
      })
      
      return { success: isValid }
    } catch (error) {
      const handledError = errorHandlingService.handleError(error as Error, 'config:testEmailConnection')
      logService.error('Failed to test email connection', handledError, { 
        config: { ...config, password: '[REDACTED]' } 
      })
      throw handledError
    }
  })

  /**
   * Import configuration from file
   */
  ipcMain.handle('config:import', async (event: IpcMainInvokeEvent, configData: any) => {
    try {
      logService.info('Importing configuration')
      
      await configurationService.importSettings(configData)
      
      logService.info('Configuration imported successfully')
      return true
    } catch (error) {
      const handledError = errorHandlingService.handleError(error as Error, 'config:import')
      logService.error('Failed to import configuration', handledError)
      throw handledError
    }
  })

  /**
   * Export configuration to file (excluding sensitive data)
   */
  ipcMain.handle('config:export', async (event: IpcMainInvokeEvent) => {
    try {
      logService.info('Exporting configuration')
      
      const configData = await configurationService.exportSettings()
      
      logService.info('Configuration exported successfully')
      return configData
    } catch (error) {
      const handledError = errorHandlingService.handleError(error as Error, 'config:export')
      logService.error('Failed to export configuration', handledError)
      throw handledError
    }
  })

  logService.info('Configuration IPC handlers registered successfully')
}