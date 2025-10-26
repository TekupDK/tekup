import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, AlertTriangle, CheckCircle, Loader } from 'lucide-react'

interface ServiceCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'loading'
  metrics?: {
    usage: number
    limit: number
  }
  color: 'primary' | 'accent' | 'success' | 'warning' | 'danger'
  delay?: number
}

export default function ServiceCard({
  title,
  description,
  icon,
  href,
  status,
  metrics,
  color,
  delay = 0
}: ServiceCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-success-400" />
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-warning-400" />
      case 'unhealthy': return <AlertTriangle className="w-4 h-4 text-danger-400" />
      case 'loading': return <Loader className="w-4 h-4 text-slate-400 animate-spin" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'healthy': return 'Optimal'
      case 'degraded': return 'Degraderet'
      case 'unhealthy': return 'Ikke tilgængelig'
      case 'loading': return 'Indlæser...'
    }
  }

  const getColorClasses = () => {
    switch (color) {
      case 'primary': return 'from-primary-500 to-primary-600 text-primary-400'
      case 'accent': return 'from-accent-500 to-accent-600 text-accent-400'
      case 'success': return 'from-success-500 to-success-600 text-success-400'
      case 'warning': return 'from-warning-500 to-warning-600 text-warning-400'
      case 'danger': return 'from-danger-500 to-danger-600 text-danger-400'
    }
  }

  const usagePercentage = metrics ? (metrics.usage / metrics.limit) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group"
    >
      <Link to={href} className="block">
        <div className="card-glass hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 bg-gradient-to-br ${getColorClasses()} rounded-xl text-white`}>
              {icon}
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                {description}
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Status: <span className={`${
                  status === 'healthy' ? 'text-success-400' :
                  status === 'degraded' ? 'text-warning-400' :
                  status === 'unhealthy' ? 'text-danger-400' : 'text-slate-400'
                }`}>
                  {getStatusText()}
                </span>
              </span>
            </div>

            {/* Usage Metrics */}
            {metrics && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Månedlig usage</span>
                  <span className="text-white font-medium">
                    {metrics.usage.toLocaleString()} / {metrics.limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${getColorClasses()} transition-all duration-500`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400">
                  {usagePercentage.toFixed(1)}% anvendt
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
