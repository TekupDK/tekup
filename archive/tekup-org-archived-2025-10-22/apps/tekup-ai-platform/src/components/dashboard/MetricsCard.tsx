import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricsCardProps {
  title: string
  value: string
  change?: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  color: 'primary' | 'accent' | 'success' | 'warning' | 'danger'
  delay?: number
}

export default function MetricsCard({
  title,
  value,
  change,
  trend,
  icon,
  color,
  delay = 0
}: MetricsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />
      case 'down': return <TrendingDown className="w-4 h-4" />
      case 'neutral': return <Minus className="w-4 h-4" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-success-400 bg-success-500/20'
      case 'down': return 'text-danger-400 bg-danger-500/20'
      case 'neutral': return 'text-slate-400 bg-slate-500/20'
    }
  }

  const getIconColor = () => {
    switch (color) {
      case 'primary': return 'text-primary-400 bg-primary-500/20'
      case 'accent': return 'text-accent-400 bg-accent-500/20'
      case 'success': return 'text-success-400 bg-success-500/20'
      case 'warning': return 'text-warning-400 bg-warning-500/20'
      case 'danger': return 'text-danger-400 bg-danger-500/20'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="card-glass hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${getIconColor()}`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            {change}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
          {title}
        </h3>
        <div className="text-2xl font-bold text-white">
          {value}
        </div>
      </div>
    </motion.div>
  )
}
