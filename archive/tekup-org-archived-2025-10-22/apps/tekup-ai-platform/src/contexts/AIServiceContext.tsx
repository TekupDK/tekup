import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AIServiceCategory } from '@tekup/sso'

// AI Service Status
interface ServiceStatus {
  category: AIServiceCategory
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'loading'
  responseTime: number
  errorRate: number
  lastCheck: Date
  uptime: number
  version: string
  endpoints: string[]
  features: string[]
}

// Service Metrics
interface ServiceMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  avgResponseTime: number
  tokensUsed: number
  cost: number
}

interface AIServiceContextType {
  services: ServiceStatus[]
  metrics: Record<AIServiceCategory, ServiceMetrics>
  isLoading: boolean
  healthyServices: number
  totalServices: number
  overallHealth: 'healthy' | 'degraded' | 'unhealthy'
  refreshServices: () => Promise<void>
  getServiceStatus: (category: AIServiceCategory) => ServiceStatus | undefined
  getServiceMetrics: (category: AIServiceCategory) => ServiceMetrics | undefined
  isServiceHealthy: (category: AIServiceCategory) => boolean
}

const AIServiceContext = createContext<AIServiceContextType | undefined>(undefined)

// Mock service data for development
const mockServices: ServiceStatus[] = [
  {
    category: AIServiceCategory.PROPOSAL,
    name: 'AI Proposal Engine',
    status: 'healthy',
    responseTime: 1250,
    errorRate: 0.02,
    lastCheck: new Date(),
    uptime: 99.8,
    version: '1.2.0',
    endpoints: ['/proposals/generate', '/proposals/analyze', '/proposals/research'],
    features: ['buying_signal_detection', 'research_integration', 'document_generation']
  },
  {
    category: AIServiceCategory.CONTENT,
    name: 'AI Content Generator',
    status: 'healthy',
    responseTime: 980,
    errorRate: 0.01,
    lastCheck: new Date(),
    uptime: 99.9,
    version: '1.1.5',
    endpoints: ['/content/generate', '/content/optimize', '/content/translate'],
    features: ['blog_generation', 'social_media', 'seo_optimization', 'translation']
  },
  {
    category: AIServiceCategory.SUPPORT,
    name: 'AI Customer Support',
    status: 'degraded',
    responseTime: 2100,
    errorRate: 0.05,
    lastCheck: new Date(),
    uptime: 98.5,
    version: '1.0.8',
    endpoints: ['/support/chat', '/support/tickets', '/support/escalate'],
    features: ['chatbot', 'ticket_routing', 'sentiment_analysis']
  },
  {
    category: AIServiceCategory.CRM,
    name: 'Enhanced CRM',
    status: 'healthy',
    responseTime: 850,
    errorRate: 0.01,
    lastCheck: new Date(),
    uptime: 99.7,
    version: '2.1.0',
    endpoints: ['/crm/leads', '/crm/contacts', '/crm/deals'],
    features: ['lead_scoring', 'contact_enrichment', 'deal_insights']
  },
  {
    category: AIServiceCategory.MARKETING,
    name: 'Marketing Automation',
    status: 'healthy',
    responseTime: 1100,
    errorRate: 0.03,
    lastCheck: new Date(),
    uptime: 99.4,
    version: '1.3.2',
    endpoints: ['/marketing/campaigns', '/marketing/optimize', '/marketing/analytics'],
    features: ['campaign_optimization', 'audience_segmentation', 'personalization']
  },
  {
    category: AIServiceCategory.PROJECT,
    name: 'Project Management',
    status: 'healthy',
    responseTime: 750,
    errorRate: 0.02,
    lastCheck: new Date(),
    uptime: 99.6,
    version: '1.0.5',
    endpoints: ['/projects/optimize', '/projects/predict', '/projects/analyze'],
    features: ['task_automation', 'resource_optimization', 'timeline_prediction']
  },
  {
    category: AIServiceCategory.ANALYTICS,
    name: 'AI Analytics Platform',
    status: 'loading',
    responseTime: 0,
    errorRate: 0,
    lastCheck: new Date(),
    uptime: 100,
    version: '1.1.0',
    endpoints: ['/analytics/predict', '/analytics/insights', '/analytics/reports'],
    features: ['predictive_analytics', 'anomaly_detection', 'forecasting']
  },
  {
    category: AIServiceCategory.VOICE_AI,
    name: 'Voice AI & Computer Vision',
    status: 'healthy',
    responseTime: 1800,
    errorRate: 0.04,
    lastCheck: new Date(),
    uptime: 98.9,
    version: '1.0.3',
    endpoints: ['/voice/transcribe', '/voice/synthesize', '/vision/analyze'],
    features: ['speech_to_text', 'text_to_speech', 'image_recognition']
  },
  {
    category: AIServiceCategory.BUSINESS_INTELLIGENCE,
    name: 'Business Intelligence',
    status: 'healthy',
    responseTime: 950,
    errorRate: 0.01,
    lastCheck: new Date(),
    uptime: 99.8,
    version: '1.2.1',
    endpoints: ['/bi/reports', '/bi/dashboards', '/bi/insights'],
    features: ['report_generation', 'dashboard_automation', 'data_visualization']
  }
]

const mockMetrics: Record<AIServiceCategory, ServiceMetrics> = {
  [AIServiceCategory.PROPOSAL]: {
    totalRequests: 1254,
    successfulRequests: 1228,
    failedRequests: 26,
    avgResponseTime: 1250,
    tokensUsed: 125400,
    cost: 37.62
  },
  [AIServiceCategory.CONTENT]: {
    totalRequests: 2156,
    successfulRequests: 2134,
    failedRequests: 22,
    avgResponseTime: 980,
    tokensUsed: 89600,
    cost: 26.88
  },
  [AIServiceCategory.SUPPORT]: {
    totalRequests: 3421,
    successfulRequests: 3250,
    failedRequests: 171,
    avgResponseTime: 2100,
    tokensUsed: 156780,
    cost: 47.03
  },
  [AIServiceCategory.CRM]: {
    totalRequests: 1876,
    successfulRequests: 1857,
    failedRequests: 19,
    avgResponseTime: 850,
    tokensUsed: 45230,
    cost: 13.57
  },
  [AIServiceCategory.MARKETING]: {
    totalRequests: 987,
    successfulRequests: 957,
    failedRequests: 30,
    avgResponseTime: 1100,
    tokensUsed: 67890,
    cost: 20.37
  },
  [AIServiceCategory.PROJECT]: {
    totalRequests: 654,
    successfulRequests: 641,
    failedRequests: 13,
    avgResponseTime: 750,
    tokensUsed: 32100,
    cost: 9.63
  },
  [AIServiceCategory.ANALYTICS]: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    tokensUsed: 0,
    cost: 0
  },
  [AIServiceCategory.VOICE_AI]: {
    totalRequests: 432,
    successfulRequests: 415,
    failedRequests: 17,
    avgResponseTime: 1800,
    tokensUsed: 78900,
    cost: 23.67
  },
  [AIServiceCategory.BUSINESS_INTELLIGENCE]: {
    totalRequests: 789,
    successfulRequests: 781,
    failedRequests: 8,
    avgResponseTime: 950,
    tokensUsed: 34560,
    cost: 10.37
  }
}

interface AIServiceProviderProps {
  children: ReactNode
}

export function AIServiceProvider({ children }: AIServiceProviderProps) {
  const [services, setServices] = useState<ServiceStatus[]>(mockServices)
  const [metrics, setMetrics] = useState<Record<AIServiceCategory, ServiceMetrics>>(mockMetrics)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate derived values
  const healthyServices = services.filter(service => service.status === 'healthy').length
  const totalServices = services.length
  
  const overallHealth: 'healthy' | 'degraded' | 'unhealthy' = (() => {
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length
    const degradedCount = services.filter(s => s.status === 'degraded').length
    
    if (unhealthyCount > 0) return 'unhealthy'
    if (degradedCount > 0) return 'degraded'
    return 'healthy'
  })()

  // Refresh services status
  const refreshServices = async (): Promise<void> => {
    setIsLoading(true)
    
    try {
      if (process.env.NODE_ENV === 'development') {
        // Mock refresh with slight variations
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const updatedServices = services.map(service => ({
          ...service,
          lastCheck: new Date(),
          responseTime: service.responseTime + (Math.random() * 200 - 100),
          errorRate: Math.max(0, service.errorRate + (Math.random() * 0.02 - 0.01))
        }))
        
        setServices(updatedServices)
      } else {
        // Real API call to get service status
        const response = await fetch('/api/services/status')
        if (!response.ok) {
          throw new Error('Failed to fetch service status')
        }
        
        const { services: serviceData, metrics: metricsData } = await response.json()
        setServices(serviceData)
        setMetrics(metricsData)
      }
    } catch (error) {
      console.error('Failed to refresh services:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh services every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshServices, 30000)
    return () => clearInterval(interval)
  }, [])

  const getServiceStatus = (category: AIServiceCategory): ServiceStatus | undefined => {
    return services.find(service => service.category === category)
  }

  const getServiceMetrics = (category: AIServiceCategory): ServiceMetrics | undefined => {
    return metrics[category]
  }

  const isServiceHealthy = (category: AIServiceCategory): boolean => {
    const service = getServiceStatus(category)
    return service?.status === 'healthy'
  }

  const value: AIServiceContextType = {
    services,
    metrics,
    isLoading,
    healthyServices,
    totalServices,
    overallHealth,
    refreshServices,
    getServiceStatus,
    getServiceMetrics,
    isServiceHealthy
  }

  return (
    <AIServiceContext.Provider value={value}>
      {children}
    </AIServiceContext.Provider>
  )
}

export const useAIServices = (): AIServiceContextType => {
  const context = useContext(AIServiceContext)
  if (context === undefined) {
    throw new Error('useAIServices must be used within an AIServiceProvider')
  }
  return context
}

