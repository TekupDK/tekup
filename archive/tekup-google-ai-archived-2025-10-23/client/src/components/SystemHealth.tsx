import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Database, 
  Server, 
  Wifi,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { healthService, HealthStatus, HealthCheck } from '../services/healthService'
import { useErrorTracking } from '../hooks/useErrorTracking'

interface SystemHealthProps {
  showDetails?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  className?: string
}

const SystemHealth: React.FC<SystemHealthProps> = ({
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 30000,
  className = ''
}) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const { reportError, trackUserAction } = useErrorTracking({ component: 'SystemHealth' })

  useEffect(() => {
    // Initial health check
    checkHealth()

    // Set up auto-refresh if enabled
    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(checkHealth, refreshInterval)
    }

    // Subscribe to health changes
    const unsubscribe = healthService.onHealthChange((status) => {
      setHealthStatus(status)
      setLastRefresh(new Date())
    })

    return () => {
      if (interval) clearInterval(interval)
      unsubscribe()
    }
  }, [autoRefresh, refreshInterval])

  const checkHealth = async () => {
    try {
      setLoading(true)
      const status = await healthService.checkHealth()
      setHealthStatus(status)
      setLastRefresh(new Date())
    } catch (error) {
      reportError(error as Error, { action: 'checkHealth' })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    trackUserAction('manual_health_refresh')
    checkHealth()
  }

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getCheckIcon = (checkType: string) => {
    switch (checkType) {
      case 'api':
        return <Server className="w-4 h-4" />
      case 'database':
        return <Database className="w-4 h-4" />
      case 'cache':
        return <Zap className="w-4 h-4" />
      case 'external':
        return <Wifi className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  if (loading && !healthStatus) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-600">Kontrollerer system status...</span>
        </div>
      </div>
    )
  }

  if (!healthStatus) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">Kunne ikke hente system status</span>
          </div>
          <button
            onClick={handleRefresh}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Prøv igen</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b rounded-t-lg ${getStatusColor(healthStatus.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <h3 className="font-medium">System Status</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
              {healthStatus.status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {lastRefresh && (
              <span className="text-xs opacity-75">
                Sidst opdateret: {lastRefresh.toLocaleTimeString('da-DK')}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Quick Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {healthStatus.metrics.responseTime}ms
            </div>
            <div className="text-xs text-gray-500">Responstid</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {formatUptime(healthStatus.metrics.uptime)}
            </div>
            <div className="text-xs text-gray-500">Oppetid</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${
              healthStatus.metrics.errorRate > 5 ? 'text-red-600' : 'text-green-600'
            }`}>
              {healthStatus.metrics.errorRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Fejlrate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {healthStatus.metrics.memoryUsage ? 
                `${healthStatus.metrics.memoryUsage.toFixed(1)}MB` : 
                'N/A'
              }
            </div>
            <div className="text-xs text-gray-500">Hukommelse</div>
          </div>
        </div>

        {/* Detailed Checks */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">System Komponenter</h4>
            {Object.entries(healthStatus.checks).map(([checkType, check]) => (
              <div key={checkType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getCheckIcon(checkType)}
                  <div>
                    <div className="font-medium text-sm capitalize">
                      {checkType === 'api' ? 'API Server' :
                       checkType === 'database' ? 'Database' :
                       checkType === 'cache' ? 'Cache' :
                       checkType === 'external' ? 'Eksterne Tjenester' :
                       checkType}
                    </div>
                    {check.error && (
                      <div className="text-xs text-red-600 mt-1">{check.error}</div>
                    )}
                    {check.responseTime && (
                      <div className="text-xs text-gray-500 mt-1">
                        Responstid: {check.responseTime}ms
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(check.status)}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    check.status === 'pass' ? 'bg-green-100 text-green-800' :
                    check.status === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {check.status === 'pass' ? 'OK' :
                     check.status === 'warn' ? 'ADVARSEL' :
                     'FEJL'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Message */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-2">
            {healthStatus.status === 'healthy' ? (
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            ) : healthStatus.status === 'degraded' ? (
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
            )}
            <div>
              <div className="text-sm font-medium">
                {healthStatus.status === 'healthy' ? 'Alle systemer kører normalt' :
                 healthStatus.status === 'degraded' ? 'Nogle systemer oplever problemer' :
                 'Kritiske systemer er nede'}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Sidst kontrolleret: {new Date(healthStatus.timestamp).toLocaleString('da-DK')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemHealth