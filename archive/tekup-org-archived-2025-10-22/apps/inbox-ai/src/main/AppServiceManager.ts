/**
 * TekUp Secure Platform Service Manager - Coordinates all security modules
 */

import { EventEmitter } from 'events'
import {
  LogService,
  ConfigurationServiceImpl,
  ValidationService,
  ErrorHandlingService
} from './services/index.js'
import { EmailService } from './services/EmailService'
import { AIService } from './services/AIService'
import { ChatbotService } from './services/ChatbotService'
import { DatabaseService } from './services/DatabaseService'
import { MCPService } from './services/MCPService'
// ProjectXService removed - use FlowIngestionService instead
import { FlowIngestionService } from './services/FlowIngestionService'
import { AccountRepositoryImpl } from './repositories/AccountRepository.js'
import { initializeDatabase, AppDatabase } from './database/Database.js'
import { AppError } from '@shared/types'

// Security Module Imports (to be implemented)
// import { MicrosoftGraphService, TenantService } from '../modules/shared/index.js'
// import { NIS2Scanner } from '../modules/nis2/index.js'
// import { CopilotReadinessScanner } from '../modules/copilot/index.js'
// import { BackupMonitor } from '../modules/backup/index.js'
// import { PDFReportService } from '../modules/reports/index.js'

export interface ServiceStatus {
  name: string
  status: 'initializing' | 'running' | 'stopped' | 'error'
  error?: string
  lastUpdate: Date
}

export class AppServiceManager extends EventEmitter {
  private database: AppDatabase | null = null
  private config: ConfigurationServiceImpl | null = null
  private validation: ValidationService | null = null
  private errorHandler: ErrorHandlingService | null = null
  
  // TekUp Secure Platform Core Services
  private emailService: EmailService | null = null
  private aiService: AIService | null = null
  private chatbotService: ChatbotService | null = null
  private dbService: DatabaseService | null = null
  private mcpService: MCPService | null = null
  // projectXService removed - use flowIngestionService instead
  // New canonical ingestion service (parallel during deprecation window)
  private flowIngestionService: FlowIngestionService | null = null
  
  // Security Module Services - TekUp Secure Platform Core
  private graphService: any | null = null
  private tenantService: any | null = null
  private nis2Scanner: any | null = null
  private copilotScanner: any | null = null
  private backupMonitor: any | null = null
  private reportService: any | null = null
  
  private accountRepository: AccountRepositoryImpl | null = null
  private log: LogService
  
  private serviceStatus = new Map<string, ServiceStatus>()
  private isInitialized = false
  private isShuttingDown = false
  private initializationPromise: Promise<void> | null = null
  
  // Background timers
  private syncTimer?: NodeJS.Timeout
  private maintenanceTimer?: NodeJS.Timeout

  constructor() {
    super()
    this.log = new LogService()
    this.log.info('TekUp Secure Platform Service Manager created')
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this._doInitialize()
    return this.initializationPromise
  }

  /**
   * Internal initialization logic
   */
  private async _doInitialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      this.log.info('Starting security platform initialization')
      
      // Initialize core services first
      await this.initializeCore()
      
      // Initialize security modules
      await this.initializeSecurityModules()
      
      // Set up service interactions
      this.setupServiceInteractions()
      
      // Setup IPC handlers now that all services are ready
      this.setupIPCHandlers()
      
      // Start background processes
      await this.startBackgroundProcesses()
      
      this.isInitialized = true
      this.log.info('TekUp Secure Platform initialized successfully')
      this.emit('initialized')
      
    } catch (error) {
      this.log.error('Security platform initialization failed', error as Error)
      this.emit('initializationFailed', error)
      throw error
    }
  }

  /**
   * Initialize core services (database, config, validation, etc.)
   */
  private async initializeCore(): Promise<void> {
    try {
      // Database
      this.updateServiceStatus('database', 'initializing')
      this.database = await initializeDatabase()
      this.updateServiceStatus('database', 'running')
      this.log.info('Database initialized')

      // Configuration
      this.updateServiceStatus('configuration', 'initializing')
      this.config = new ConfigurationServiceImpl(this.database)
      await this.config.initialize()
      this.updateServiceStatus('configuration', 'running')
      this.log.info('Configuration service initialized')

      // Validation
      this.updateServiceStatus('validation', 'initializing')
      this.validation = new ValidationService()
      this.updateServiceStatus('validation', 'running')
      this.log.info('Validation service initialized')

      // Error handling
      this.updateServiceStatus('errorHandling', 'initializing')
      this.errorHandler = new ErrorHandlingService()
      this.updateServiceStatus('errorHandling', 'running')
      this.log.info('Error handling service initialized')
      
      // Account repository
      this.updateServiceStatus('accountRepository', 'initializing')
      this.accountRepository = new AccountRepositoryImpl(this.database)
      this.updateServiceStatus('accountRepository', 'running')
      this.log.info('Account repository initialized')

      // Database service for chatbot
      this.updateServiceStatus('databaseService', 'initializing')
      this.dbService = new DatabaseService()
      this.updateServiceStatus('databaseService', 'running')
      this.log.info('Database service initialized')

      // Email service
      this.updateServiceStatus('emailService', 'initializing')
      this.emailService = new EmailService(this.database, this.config)
      await this.emailService.initialize()
      this.updateServiceStatus('emailService', 'running')
      this.log.info('Email service initialized')

      // AI service
      this.updateServiceStatus('aiService', 'initializing')
      this.aiService = new AIService(this.database, this.config)
      await this.aiService.initialize()
      this.updateServiceStatus('aiService', 'running')
      this.log.info('AI service initialized')

      // MCP service
       this.updateServiceStatus('mcpService', 'initializing')
       this.mcpService = new MCPService(this.log)
       await this.mcpService.initialize()
       this.updateServiceStatus('mcpService', 'running')
       this.log.info('MCP service initialized')

      // Chatbot service
      this.updateServiceStatus('chatbotService', 'initializing')
      this.chatbotService = new ChatbotService(
        this.dbService,
        this.aiService,
        this.emailService
      )
      this.updateServiceStatus('chatbotService', 'running')
      this.log.info('Chatbot service initialized')

      // Legacy Project X service removed - using FlowIngestionService instead

      // Flow Ingestion service (TekUp Flow integration)
      this.updateServiceStatus('flowIngestionService', 'initializing')
      const flowConfig = {
        apiUrl: 'http://localhost:4000',
        defaultTenant: 'tekup',
        retryAttempts: 3,
        timeoutMs: 30000
      }
      this.flowIngestionService = new FlowIngestionService(this.config, flowConfig)
      await this.flowIngestionService.initialize()
      this.updateServiceStatus('flowIngestionService', 'running')
      this.log.info('Flow Ingestion service initialized (canonical)')

    } catch (error) {
      const errorMessage = `Core services initialization failed: ${(error as Error).message}`
      this.log.error(errorMessage, error as Error)
      throw new AppError(errorMessage, 'SERVICE_INITIALIZATION_FAILED')
    }
  }

  /**
   * Initialize security modules (Microsoft Graph, NIS2, Copilot, Backup, Reports)
   */
  private async initializeSecurityModules(): Promise<void> {
    try {
      if (!this.database || !this.config) {
        throw new Error('Core services not initialized')
      }

      // Initialize Microsoft Graph Service
      this.updateServiceStatus('microsoftGraph', 'initializing')
      this.graphService = this.createGraphService()
      this.updateServiceStatus('microsoftGraph', 'running')
      this.log.info('Microsoft Graph service initialized')

      // Initialize Tenant Service
      this.updateServiceStatus('tenantService', 'initializing')
      this.tenantService = this.createTenantService()
      this.updateServiceStatus('tenantService', 'running')
      this.log.info('Tenant service initialized')

      // Initialize NIS2 Scanner
      this.updateServiceStatus('nis2Scanner', 'initializing')
      this.nis2Scanner = this.createNIS2Scanner()
      this.updateServiceStatus('nis2Scanner', 'running')
      this.log.info('NIS2 scanner initialized')

      // Initialize Copilot Readiness Scanner
      this.updateServiceStatus('copilotScanner', 'initializing')
      this.copilotScanner = this.createCopilotScanner()
      this.updateServiceStatus('copilotScanner', 'running')
      this.log.info('Copilot scanner initialized')

      // Initialize Backup Monitor
      this.updateServiceStatus('backupMonitor', 'initializing')
      this.backupMonitor = this.createBackupMonitor()
      this.updateServiceStatus('backupMonitor', 'running')
      this.log.info('Backup monitor initialized')

      // Initialize Report Service
      this.updateServiceStatus('reportService', 'initializing')
      this.reportService = this.createReportService()
      this.updateServiceStatus('reportService', 'running')
      this.log.info('Report service initialized')

    } catch (error) {
      const errorMessage = `Security modules initialization failed: ${(error as Error).message}`
      this.log.error(errorMessage, error as Error)
      throw new AppError(errorMessage, 'SERVICE_INITIALIZATION_FAILED')
    }
  }

  /**
   * Create Microsoft Graph Service instance
   */
  private createGraphService(): any {
    return {
      // Placeholder implementation - will be replaced with actual Microsoft Graph SDK
      authenticate: async (tenantId: string) => {
        this.log.info('Graph service authenticate placeholder', { tenantId })
        return true
      },
      getUsers: async () => [],
      getDevices: async () => [],
      getConditionalAccessPolicies: async () => []
    }
  }

  /**
   * Create Tenant Service instance
   */
  private createTenantService(): any {
    return {
      // Placeholder implementation
      addTenant: async (tenant: any) => {
        this.log.info('Tenant service add placeholder', { tenantId: tenant.id })
        return tenant
      },
      getTenants: async () => []
    }
  }

  /**
   * Create NIS2 Scanner instance
   */
  private createNIS2Scanner(): any {
    return {
      // Placeholder implementation
      scan: async (tenantId: string) => {
        this.log.info('NIS2 scan placeholder', { tenantId })
        return { score: 75, findings: [] }
      }
    }
  }

  /**
   * Create Copilot Scanner instance
   */
  private createCopilotScanner(): any {
    return {
      // Placeholder implementation
      scan: async (tenantId: string) => {
        this.log.info('Copilot readiness scan placeholder', { tenantId })
        return { score: 60, findings: [] }
      }
    }
  }

  /**
   * Create Backup Monitor instance
   */
  private createBackupMonitor(): any {
    return {
      // Placeholder implementation
      checkStatus: async (tenantId: string) => {
        this.log.info('Backup monitor check placeholder', { tenantId })
        return { status: 'healthy', lastBackup: new Date() }
      }
    }
  }

  /**
   * Create Report Service instance
   */
  private createReportService(): any {
    return {
      // Placeholder implementation
      generateReport: async (type: string, _data: any) => {
        this.log.info('Report generation placeholder', { type })
        return { path: '/tmp/report.pdf', generated: new Date() }
      }
    }
  }

  /**
   * Set up interactions between security services
   */
  private setupServiceInteractions(): void {
    try {
      // Connect compliance scanners to reporting service
      if (this.nis2Scanner && this.reportService) {
        this.nis2Scanner.on('scanCompleted', (results: any) => {
          this.log.debug('NIS2 scan completed, generating report', { findings: results.findings?.length })
          // Trigger report generation
        })
      }

      if (this.copilotScanner && this.reportService) {
        this.copilotScanner.on('scanCompleted', (results: any) => {
          this.log.debug('Copilot readiness scan completed', { score: results.score })
          // Trigger report generation
        })
      }

      // Connect backup monitor to alerting
      if (this.backupMonitor) {
        this.backupMonitor.on('backupFailed', (alert: any) => {
          this.log.warn('Backup failure detected', alert)
          // Trigger alert notifications
        })
      }

      // Connect tenant service to all scanners
      if (this.tenantService) {
        this.tenantService.on('tenantAdded', (tenant: any) => {
          this.log.info('New tenant added, initializing scans', { tenantId: tenant.id })
          // Initialize compliance scans for new tenant
        })
      }

      this.log.info('Security service interactions configured')
    } catch (error) {
      this.log.error('Failed to setup service interactions', error as Error)
    }
  }
  
  /**
   * Setup IPC handlers to bridge preload API with backend services
   */
  private setupIPCHandlers(): void {
    try {
      this.log.info('Setting up TekUp Secure Platform IPC handlers')
      
      // Import and setup chatbot handlers
      if (this.chatbotService) {
        const { setupChatbotHandlers } = require('./ipc/chatbot-handlers')
        setupChatbotHandlers(this.chatbotService)
        this.log.info('Chatbot IPC handlers registered')
      }

      // Register MCP handlers
      if (this.mcpService) {
        const { setupMCPHandlers } = require('./ipc/mcp-handlers')
        setupMCPHandlers(this.mcpService)
        this.log.info('MCP IPC handlers registered')
      }
      
      // TODO: Implement compliance-specific IPC handlers:
      // - Tenant management
      // - NIS2 scanning
      // - Copilot readiness
      // - Backup monitoring
      // - Report generation
      
      this.log.info('IPC handlers setup completed')
      
    } catch (error) {
      this.log.error('Failed to setup IPC handlers', error as Error)
      throw error
    }
  }

  /**
   * Start background processes for security monitoring
   */
  private async startBackgroundProcesses(): Promise<void> {
    try {
      // Start periodic compliance scans
      const scanIntervalMinutes = this.config ? await this.config.get('scanInterval', 60) : 60 // 1 hour default
      const scanInterval = scanIntervalMinutes * 60 * 1000 // Convert minutes to ms
      
      if (scanInterval) {
        this.syncTimer = setInterval(() => {
          this.performPeriodicScans()
        }, scanInterval)
        
        this.log.info('Periodic compliance scans scheduled', { interval: scanInterval })
      }

      // Start backup monitoring
      this.maintenanceTimer = setInterval(() => {
        this.performMaintenance()
      }, 60 * 60 * 1000) // Every hour

      this.log.info('Security monitoring background processes started')

    } catch (error) {
      this.log.error('Failed to start background processes', error as Error)
    }
  }

  /**
   * Perform periodic compliance scans for all tenants
   */
  private async performPeriodicScans(): Promise<void> {
    try {
      this.log.debug('Starting periodic compliance scans')
      
      // TODO: Implement periodic scanning logic
      // - Get all active tenants
      // - Run NIS2, Copilot, and backup scans
      // - Generate reports if needed
      
      this.log.debug('Periodic compliance scans completed')
    } catch (error) {
      this.log.error('Periodic compliance scans failed', error as Error)
    }
  }

  /**
   * Perform maintenance tasks
   */
  private async performMaintenance(): Promise<void> {
    try {
      this.log.debug('Starting maintenance tasks')

      // Database maintenance
      if (this.database) {
        this.database.vacuum()
      }

      // Clear old scan results and reports
      // TODO: Implement cleanup of old compliance data

      this.log.debug('Maintenance tasks completed')
    } catch (error) {
      this.log.error('Maintenance tasks failed', error as Error)
    }
  }

  /**
   * Handle service errors
   */
  private handleServiceError(serviceName: string, error: Error): void {
    this.log.error(`Service error in ${serviceName}`, error)
    
    this.updateServiceStatus(serviceName, 'error', error.message)
    
    this.emit('serviceError', {
      service: serviceName,
      error,
      timestamp: new Date()
    })
  }

  /**
   * Update service status
   */
  private updateServiceStatus(
    name: string, 
    status: ServiceStatus['status'], 
    error?: string
  ): void {
    const serviceStatus: ServiceStatus = {
      name,
      status,
      error,
      lastUpdate: new Date()
    }
    
    this.serviceStatus.set(name, serviceStatus)
    
    this.emit('serviceStatusChanged', {
      service: name,
      status,
      error,
      timestamp: new Date()
    })
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName?: string): ServiceStatus | Map<string, ServiceStatus> {
    if (serviceName) {
      return this.serviceStatus.get(serviceName) || {
        name: serviceName,
        status: 'stopped',
        lastUpdate: new Date()
      }
    }
    return this.serviceStatus
  }

  /**
   * Get all service instances
   */
  getServices() {
    return {
      database: this.database,
      config: this.config,
      validation: this.validation,
      errorHandler: this.errorHandler,
      emailService: this.emailService,
      aiService: this.aiService,
      graphService: this.graphService,
      tenantService: this.tenantService,
      nis2Scanner: this.nis2Scanner,
      copilotScanner: this.copilotScanner,
      backupMonitor: this.backupMonitor,
      reportService: this.reportService
    }
  }

  /**
   * Get email service instance
   */
  getEmailService(): EmailService | null {
    return this.emailService
  }

  /**
   * Get AI service instance
   */
  getAIService(): AIService | null {
    return this.aiService
  }

  // getProjectXService method removed - use getFlowIngestionService() instead

  /**
   * Get Flow Ingestion service instance (preferred over ProjectXService)
   */
  getFlowIngestionService(): FlowIngestionService | null {
    return this.flowIngestionService
  }

  /**
   * Get configuration service instance
   */
  getConfigurationService(): ConfigurationServiceImpl | null {
    return this.config
  }

  /**
   * Add tenant for compliance monitoring
   */
  async addTenant(tenantConfig: any): Promise<any> {
    if (!this.tenantService) {
      throw new AppError('Tenant service not initialized', 'SERVICE_NOT_AVAILABLE')
    }
    
    return this.tenantService.addTenant(tenantConfig)
  }

  /**
   * Start compliance scan for tenant
   */
  async startComplianceScan(tenantId: string, scanType: 'nis2' | 'copilot' | 'backup'): Promise<any> {
    const scanner = scanType === 'nis2' ? this.nis2Scanner :
                   scanType === 'copilot' ? this.copilotScanner :
                   this.backupMonitor

    if (!scanner) {
      throw new AppError(`${scanType} scanner not initialized`, 'SERVICE_NOT_AVAILABLE')
    }
    
    return scanner.scan(tenantId)
  }

  /**
   * Get application health status
   */
  getHealthStatus(): any {
    const services = Array.from(this.serviceStatus.values())
    const totalServices = services.length
    const runningServices = services.filter(s => s.status === 'running').length
    const errorServices = services.filter(s => s.status === 'error').length
    
    return {
      isHealthy: errorServices === 0 && runningServices > 0,
      totalServices,
      runningServices,
      errorServices,
      services: Array.from(this.serviceStatus.entries()),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      lastCheck: new Date()
    }
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return
    }
    
    this.isShuttingDown = true
    this.log.info('Starting service shutdown')

    try {
      // Stop background processes first
      if (this.syncTimer) {
        clearInterval(this.syncTimer)
        this.syncTimer = undefined
      }
      
      if (this.maintenanceTimer) {
        clearInterval(this.maintenanceTimer)
        this.maintenanceTimer = undefined
      }
      
      // Shutdown security services
      const shutdownPromises = []
      
      // Placeholder shutdown for security services
      if (this.reportService) {
        shutdownPromises.push(
          Promise.resolve().catch((error: any) => this.log.error('Error shutting down report service', error))
        )
      }
      
      if (this.backupMonitor) {
        shutdownPromises.push(
          Promise.resolve().catch((error: any) => this.log.error('Error shutting down backup monitor', error))
        )
      }
      
      if (this.copilotScanner) {
        shutdownPromises.push(
          Promise.resolve().catch((error: any) => this.log.error('Error shutting down copilot scanner', error))
        )
      }
      
      if (this.nis2Scanner) {
        shutdownPromises.push(
          Promise.resolve().catch((error: any) => this.log.error('Error shutting down NIS2 scanner', error))
        )
      }
      
      if (this.graphService) {
        shutdownPromises.push(
          Promise.resolve().catch((error: any) => this.log.error('Error shutting down graph service', error))
        )
      }
      
      // Wait for all services to shutdown
      await Promise.all(shutdownPromises)
      
      // Close database last
      if (this.database) {
        this.database.close()
      }
      
      this.log.info('Service shutdown completed')
      this.emit('shutdown')
      
    } catch (error) {
      this.log.error('Error during service shutdown', error as Error)
      throw error
    }
  }

  /**
   * Check if services are initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }
}