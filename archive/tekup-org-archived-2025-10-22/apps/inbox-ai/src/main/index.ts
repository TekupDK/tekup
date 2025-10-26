/**
 * Main Electron process with comprehensive service initialization
 */

import { app, BrowserWindow, Menu, shell, nativeTheme, dialog } from 'electron'
import { loadConfig, logConfig } from '@tekup/config'
import { join } from 'path'
import { AppServiceManager } from './AppServiceManager.js'
import { LogService } from './services/LogService.js'
import { ErrorHandlingService } from './services/ErrorHandlingService.js'
import { createApplicationMenu } from './menu.js'
import { IPCHandlerManager } from './ipc/handlers.js'
// Updater temporarily disabled for TekUp Secure Platform
// import { setupAutoUpdater } from './updater.js'
import { AppError } from '@shared/types'

class ElectronApp {
  private mainWindow: BrowserWindow | null = null
  private serviceManager: AppServiceManager | null = null
  private log: LogService
  private errorHandler: ErrorHandlingService
  private isQuitting = false
  private isDev: boolean

  constructor() {
  // Load shared config (non-fatal for desktop unless required keys later enforced)
  try { loadConfig({ onError: (errs: string[])=> this.log?.error?.('config errors', new Error(errs.join(';'))) }); logConfig('inbox-ai:config'); } catch (e) { /* continue; optional */ }
    this.log = new LogService()
    this.errorHandler = new ErrorHandlingService()
    this.isDev = process.env.NODE_ENV === 'development'

    this.log.info('Starting TekUp Secure Platform application', {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      isDev: this.isDev
    })
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    try {
      // Set up global error handlers
      this.setupErrorHandlers()

      // Configure app behavior
      this.configureApp()

      // Initialize services
      await this.initializeServices()

      // Set up Electron event handlers
      this.setupElectronEvents()

      // Create application window when ready
      await app.whenReady()
      await this.createMainWindow()

      // Set up additional features
      this.setupAdditionalFeatures()

      this.log.info('Application initialized successfully')

    } catch (error) {
      this.log.error('Failed to initialize application', error as Error)
      await this.handleFatalError(error as Error)
    }
  }

  /**
   * Set up global error handlers
   */
  private setupErrorHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.log.error('Uncaught exception', error)
      this.handleFatalError(error)
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.log.error('Unhandled promise rejection', new Error(String(reason)), { promise })
    })

    // Handle Electron crashes
    app.on('render-process-gone', (event, webContents, details) => {
      this.log.error('Renderer process crashed', new Error('Renderer crash'), { details })
    })
  }

  /**
   * Configure application behavior
   */
  private configureApp(): void {
    // Set app user model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.tekup.secure-platform')
    }

    // Enable live reload for development
    if (this.isDev) {
      try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('electron-reload')(__dirname, {
          electron: require(`${__dirname}/../../node_modules/electron`),
          hardResetMethod: 'exit'
        })
      } catch (error) {
        // electron-reload is optional
      }
    }

    // Configure security
    app.on('web-contents-created', (event, contents) => {
      // Prevent navigation to external URLs
      contents.on('will-navigate', (navigationEvent, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl)
        
        if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
          navigationEvent.preventDefault()
        }
      })

      // Prevent opening new windows
      contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url)
        return { action: 'deny' }
      })
    })
  }

  /**
   * Initialize application services
   */
  private async initializeServices(): Promise<void> {
    try {
      this.log.info('Initializing application services')
      
      this.serviceManager = new AppServiceManager()
      await this.serviceManager.initialize()

      // Set up service event listeners
      this.setupServiceEventListeners()

      this.log.info('Application services initialized successfully')

    } catch (error) {
      this.log.error('Failed to initialize services', error as Error)
      throw error
    }
  }

  /**
   * Set up service event listeners
   */
  private setupServiceEventListeners(): void {
    if (!this.serviceManager) return

    // Listen for service errors
    this.serviceManager.on('serviceError', ({ service, error }) => {
      this.log.error(`Service error in ${service}`, error)
      
      // Show user-friendly error notification
      if (this.mainWindow) {
        this.mainWindow.webContents.send('service-error', {
          service,
          message: this.errorHandler.getUserMessage(error, 'unknown', 'UNKNOWN_ERROR'),
          timestamp: new Date().toISOString()
        })
      }
    })

    // Listen for service status changes
    this.serviceManager.on('serviceStatusChanged', ({ service, status }) => {
      this.log.debug(`Service ${service} status changed to ${status}`)
      
      if (this.mainWindow) {
        this.mainWindow.webContents.send('service-status', { service, status })
      }
    })

    // Listen for new emails
    this.serviceManager.on('newEmails', ({ accountId, emails }) => {
      this.log.debug('New emails received', { accountId, count: emails.length })
      
      if (this.mainWindow) {
        this.mainWindow.webContents.send('new-emails', { accountId, emails })
        
        // Show system notification if window is not focused
        if (!this.mainWindow.isFocused() && emails.length > 0) {
          this.showNotification('New emails received', `${emails.length} new email(s)`)
        }
      }
    })
  }

  /**
   * Set up Electron event handlers
   */
  private setupElectronEvents(): void {
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow()
      }
    })

    app.on('before-quit', (event) => {
      if (!this.isQuitting) {
        event.preventDefault()
        this.shutdown()
      }
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.shutdown()
      }
    })

    // Handle certificate errors
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      if (this.isDev) {
        // In development, ignore certificate errors
        event.preventDefault()
        callback(true)
      } else {
        // In production, use default behavior
        callback(false)
      }
    })
  }

  /**
   * Create main application window
   */
  private async createMainWindow(): Promise<void> {
    try {
      // Destroy existing window if it exists
      if (this.mainWindow) {
        this.mainWindow.destroy()
      }

      this.mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        show: false, // Don't show until ready
        webPreferences: {
          preload: join(__dirname, '../preload/index.js'),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false, // Needed for some Electron APIs
          webSecurity: !this.isDev,
        },
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        icon: this.getAppIcon(),
      })

      // Set up window event handlers
      this.setupWindowEventHandlers()

      // Load the application
      if (this.isDev) {
        await this.mainWindow.loadURL('http://localhost:3000')
        this.mainWindow.webContents.openDevTools()
      } else {
        await this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
      }

      // Show window when ready
      this.mainWindow.once('ready-to-show', () => {
        if (this.mainWindow) {
          this.mainWindow.show()
          
          // Focus window on creation
          if (this.isDev) {
            this.mainWindow.focus()
          }
        }
      })

      this.log.info('Main window created successfully')

    } catch (error) {
      this.log.error('Failed to create main window', error as Error)
      throw error
    }
  }

  /**
   * Set up window event handlers
   */
  private setupWindowEventHandlers(): void {
    if (!this.mainWindow) return

    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })

    this.mainWindow.on('unresponsive', () => {
      this.log.warn('Main window became unresponsive')
    })

    this.mainWindow.on('responsive', () => {
      this.log.info('Main window became responsive again')
    })

    // Handle window state changes
    this.mainWindow.on('minimize', () => {
      // Could implement tray functionality here
    })

    this.mainWindow.on('restore', () => {
      // Handle restore from minimized state
    })
  }

  /**
   * Set up additional features
   */
  private setupAdditionalFeatures(): void {
    // Set up application menu
    const menu = createApplicationMenu({
      isDev: this.isDev,
      onAbout: () => this.showAboutDialog(),
      onPreferences: () => this.showPreferences(),
      onQuit: () => this.shutdown()
    })
    Menu.setApplicationMenu(menu)

    // Auto-updater temporarily disabled for TekUp Secure Platform
    // if (!this.isDev) {
    //   setupAutoUpdater()
    // }

    // Set up theme handling
    nativeTheme.on('updated', () => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('theme-changed', {
          shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
          shouldUseHighContrastColors: nativeTheme.shouldUseHighContrastColors
        })
      }
    })
  }

  /**
   * Get application icon path
   */
  private getAppIcon(): string | undefined {
    if (process.platform === 'win32') {
      return join(__dirname, '../assets/icon.ico')
    } else if (process.platform === 'darwin') {
      return join(__dirname, '../assets/icon.icns')
    } else {
      return join(__dirname, '../assets/icon.png')
    }
  }

  /**
   * Show system notification
   */
  private showNotification(title: string, body: string): void {
    if (this.mainWindow && !this.mainWindow.isFocused()) {
      new Notification(title, { body })
    }
  }

  /**
   * Show about dialog
   */
  private showAboutDialog(): void {
    dialog.showMessageBox(this.mainWindow!, {
      type: 'info',
      title: 'About TekUp Secure Platform',
      message: 'TekUp Secure Platform',
      detail: `Version ${app.getVersion()}\nCompliance and security management for Danish SMEs.`,
      buttons: ['OK']
    })
  }

  /**
   * Show preferences window
   */
  private showPreferences(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('show-preferences')
    }
  }

  /**
   * Handle fatal application errors
   */
  private async handleFatalError(error: Error): Promise<void> {
    try {
      this.log.error('Fatal application error', error)

      // Show error dialog to user
      const result = await dialog.showMessageBox({
        type: 'error',
        title: 'Application Error',
        message: 'A fatal error occurred',
        detail: this.isDev ? error.message : 'Please restart the application. If the problem persists, contact support.',
        buttons: ['Restart', 'Quit'],
        defaultId: 0,
        cancelId: 1
      })

      if (result.response === 0) {
        // Restart application
        app.relaunch()
      }
    } catch (dialogError) {
      this.log.error('Failed to show error dialog', dialogError as Error)
    }

    // Force quit after showing dialog
    setTimeout(() => {
      app.exit(1)
    }, 1000)
  }

  /**
   * Shutdown application gracefully
   */
  private async shutdown(): Promise<void> {
    if (this.isQuitting) return
    
    this.isQuitting = true
    this.log.info('Starting application shutdown')

    try {
      // Stop services
      if (this.serviceManager) {
        await this.serviceManager.shutdown()
      }

      this.log.info('Application shutdown completed')
    } catch (error) {
      this.log.error('Error during shutdown', error as Error)
    } finally {
      // Force quit if still running
      setTimeout(() => {
        app.exit(0)
      }, 5000)
      
      app.quit()
    }
  }

  /**
   * Get service manager instance
   */
  getServiceManager(): AppServiceManager | null {
    return this.serviceManager
  }

  /**
   * Get main window instance
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }
}

// Create and start the application
const electronApp = new ElectronApp()
electronApp.initialize().catch((error) => {
  logger.error('Failed to start application:', error)
  process.exit(1)
})

// Export for testing
export { ElectronApp }
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-main-index-t');
