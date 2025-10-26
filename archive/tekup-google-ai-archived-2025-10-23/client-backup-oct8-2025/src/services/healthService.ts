import { logger } from '../lib/logger'
import { reportError, addBreadcrumb } from '../lib/sentry'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    api: HealthCheck
    database: HealthCheck
    cache: HealthCheck
    external: HealthCheck
  }
  metrics: {
    responseTime: number
    uptime: number
    errorRate: number
    memoryUsage?: number
  }
}

export interface HealthCheck {
  status: 'pass' | 'warn' | 'fail'
  responseTime?: number
  error?: string
  lastChecked: string
  details?: Record<string, any>
}

export interface SystemMetrics {
  apiCalls: {
    total: number
    successful: number
    failed: number
    averageResponseTime: number
  }
  errors: {
    total: number
    rate: number
    lastError?: {
      message: string
      timestamp: string
      count: number
    }
  }
  performance: {
    pageLoadTime: number
    renderTime: number
    memoryUsage: number
  }
}

class HealthService {
  private readonly API_BASE: string
  private healthStatus: HealthStatus | null = null
  private metrics: SystemMetrics
  private checkInterval: NodeJS.Timeout | null = null
  private isMonitoring = false
  private listeners: Array<(status: HealthStatus) => void> = []

  constructor() {
    // HARDCODED: Full backend URL to prevent CORS errors
    this.API_BASE = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api`
      : 'https://api.renos.dk/api'

    this.metrics = {
      apiCalls: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0
      },
      errors: {
        total: 0,
        rate: 0
      },
      performance: {
        pageLoadTime: 0,
        renderTime: 0,
        memoryUsage: 0
      }
    }

    // Initialize performance metrics
    this.initializePerformanceMetrics()
  }

  private initializePerformanceMetrics(): void {
    if (typeof window !== 'undefined' && window.performance) {
      // Page load time
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        this.metrics.performance.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart
      }

      // Memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.metrics.performance.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
      }
    }
  }

  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now()

    try {
      logger.debug('Starting health check')

      const [apiCheck, systemCheck] = await Promise.allSettled([
        this.checkApiHealth(),
        this.checkSystemHealth()
      ])

      const responseTime = Date.now() - startTime

      const status: HealthStatus = {
        status: this.determineOverallStatus([
          apiCheck.status === 'fulfilled' ? apiCheck.value : { status: 'fail' as const, lastChecked: new Date().toISOString() },
          systemCheck.status === 'fulfilled' ? systemCheck.value.database : { status: 'fail' as const, lastChecked: new Date().toISOString() },
          systemCheck.status === 'fulfilled' ? systemCheck.value.cache : { status: 'fail' as const, lastChecked: new Date().toISOString() }
        ]),
        timestamp: new Date().toISOString(),
        checks: {
          api: apiCheck.status === 'fulfilled' ? apiCheck.value : {
            status: 'fail',
            error: apiCheck.status === 'rejected' ? apiCheck.reason?.message : 'Unknown error',
            lastChecked: new Date().toISOString()
          },
          database: systemCheck.status === 'fulfilled' ? systemCheck.value.database : {
            status: 'fail',
            error: systemCheck.status === 'rejected' ? systemCheck.reason?.message : 'Unknown error',
            lastChecked: new Date().toISOString()
          },
          cache: systemCheck.status === 'fulfilled' ? systemCheck.value.cache : {
            status: 'fail',
            error: systemCheck.status === 'rejected' ? systemCheck.reason?.message : 'Unknown error',
            lastChecked: new Date().toISOString()
          },
          external: {
            status: 'pass', // Placeholder for external service checks
            lastChecked: new Date().toISOString()
          }
        },
        metrics: {
          responseTime,
          uptime: this.calculateUptime(),
          errorRate: this.metrics.errors.rate,
          memoryUsage: this.metrics.performance.memoryUsage
        }
      }

      this.healthStatus = status
      this.notifyListeners(status)

      logger.info('Health check completed', {
        component: 'HealthService',
        action: 'checkHealth',
        metadata: {
          healthStatus: status.status,
          responseTime,
          uptime: status.metrics.uptime
        }
      })

      return status

    } catch (error) {
      const errorStatus: HealthStatus = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          api: { status: 'fail', error: 'Health check failed', lastChecked: new Date().toISOString() },
          database: { status: 'fail', error: 'Health check failed', lastChecked: new Date().toISOString() },
          cache: { status: 'fail', error: 'Health check failed', lastChecked: new Date().toISOString() },
          external: { status: 'fail', error: 'Health check failed', lastChecked: new Date().toISOString() }
        },
        metrics: {
          responseTime: Date.now() - startTime,
          uptime: 0,
          errorRate: 100
        }
      }

      logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error)
      reportError(error as Error, { component: 'HealthService', action: 'checkHealth' })

      return errorStatus
    }
  }

  private async checkApiHealth(): Promise<HealthCheck> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.API_BASE}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      const responseTime = Date.now() - startTime

      if (!response.ok) {
        throw new Error(`API health check failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      this.updateApiMetrics(true, responseTime)

      return {
        status: 'pass',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data
      }

    } catch (error) {
      const responseTime = Date.now() - startTime
      this.updateApiMetrics(false, responseTime)

      return {
        status: 'fail',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      }
    }
  }

  private async checkSystemHealth(): Promise<{ database: HealthCheck; cache: HealthCheck }> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.API_BASE}/dashboard/system/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      const responseTime = Date.now() - startTime

      if (!response.ok) {
        throw new Error(`System health check failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      return {
        database: {
          status: data.database?.status === 'connected' ? 'pass' : 'fail',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: data.database
        },
        cache: {
          status: data.cache ? 'pass' : 'warn',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: data.cache
        }
      }

    } catch (error) {
      const responseTime = Date.now() - startTime

      return {
        database: {
          status: 'fail',
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date().toISOString()
        },
        cache: {
          status: 'fail',
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date().toISOString()
        }
      }
    }
  }

  private determineOverallStatus(checks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const failedChecks = checks.filter(check => check.status === 'fail').length
    const warnChecks = checks.filter(check => check.status === 'warn').length

    if (failedChecks > 0) {
      return failedChecks >= checks.length / 2 ? 'unhealthy' : 'degraded'
    }

    if (warnChecks > 0) {
      return 'degraded'
    }

    return 'healthy'
  }

  private updateApiMetrics(success: boolean, responseTime: number): void {
    this.metrics.apiCalls.total++

    if (success) {
      this.metrics.apiCalls.successful++
    } else {
      this.metrics.apiCalls.failed++
      this.metrics.errors.total++
    }

    // Update average response time
    this.metrics.apiCalls.averageResponseTime =
      (this.metrics.apiCalls.averageResponseTime * (this.metrics.apiCalls.total - 1) + responseTime) /
      this.metrics.apiCalls.total

    // Update error rate
    this.metrics.errors.rate = (this.metrics.apiCalls.failed / this.metrics.apiCalls.total) * 100
  }

  private calculateUptime(): number {
    // Simple uptime calculation based on when the service was initialized
    // In a real implementation, this would be more sophisticated
    return Date.now() - (window as any).__APP_START_TIME || 0
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      logger.warn('Health monitoring is already running')
      return
    }

    logger.info('Starting health monitoring', { intervalMs })

    this.isMonitoring = true

    // Initial check
    this.checkHealth()

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkHealth()
    }, intervalMs)

    addBreadcrumb('Health monitoring started', 'info', 'system', { intervalMs })
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return
    }

    logger.info('Stopping health monitoring')

    this.isMonitoring = false

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    addBreadcrumb('Health monitoring stopped', 'info', 'system')
  }

  getLastHealthStatus(): HealthStatus | null {
    return this.healthStatus
  }

  getMetrics(): SystemMetrics {
    return { ...this.metrics }
  }

  onHealthChange(callback: (status: HealthStatus) => void): () => void {
    this.listeners.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(status: HealthStatus): void {
    this.listeners.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        logger.error('Error in health status listener', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error)
      }
    })
  }

  // Utility method to check if system is healthy
  isHealthy(): boolean {
    return this.healthStatus?.status === 'healthy'
  }

  // Utility method to get health summary
  getHealthSummary(): { status: string; message: string; details?: any } {
    if (!this.healthStatus) {
      return {
        status: 'unknown',
        message: 'Health status not available'
      }
    }

    const { status, checks, metrics } = this.healthStatus

    let message = ''
    switch (status) {
      case 'healthy':
        message = 'All systems operational'
        break
      case 'degraded':
        message = 'Some systems experiencing issues'
        break
      case 'unhealthy':
        message = 'Critical systems are down'
        break
    }

    return {
      status,
      message,
      details: {
        checks: Object.keys(checks).reduce((acc, key) => {
          const check = checks[key as keyof typeof checks]
          acc[key] = {
            status: check.status,
            error: check.error
          }
          return acc
        }, {} as Record<string, any>),
        metrics: {
          responseTime: `${metrics.responseTime}ms`,
          errorRate: `${metrics.errorRate.toFixed(1)}%`,
          uptime: `${Math.floor(metrics.uptime / 1000)}s`
        }
      }
    }
  }
}

// Export singleton instance
export const healthService = new HealthService()

// Set app start time for uptime calculation
if (typeof window !== 'undefined') {
  (window as any).__APP_START_TIME = Date.now()
}