import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Brain, Target, DollarSign, BarChart3 } from 'lucide-react'

interface AIInsightCardProps {
  title: string
  value: string
  description: string
  trend: 'up' | 'down' | 'neutral'
  category: 'performance' | 'content' | 'crm' | 'financial'
  delay?: number
}

export default function AIInsightCard({
  title,
  value,
  description,
  trend,
  category,
  delay = 0
}: AIInsightCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />
      case 'down': return <TrendingDown className="w-4 h-4" />
      case 'neutral': return <BarChart3 className="w-4 h-4" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-success-400 bg-success-500/20'
      case 'down': return 'text-danger-400 bg-danger-500/20'
      case 'neutral': return 'text-slate-400 bg-slate-500/20'
    }
  }

  const getCategoryIcon = () => {
    switch (category) {
      case 'performance': return <Target className="w-5 h-5" />
      case 'content': return <Brain className="w-5 h-5" />
      case 'crm': return <BarChart3 className="w-5 h-5" />
      case 'financial': return <DollarSign className="w-5 h-5" />
    }
  }

  const getCategoryColor = () => {
    switch (category) {
      case 'performance': return 'text-primary-400 bg-primary-500/20'
      case 'content': return 'text-accent-400 bg-accent-500/20'
      case 'crm': return 'text-success-400 bg-success-500/20'
      case 'financial': return 'text-warning-400 bg-warning-500/20'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card-glass hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
    >
      {/* AI Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4 w-20 h-20 border border-primary-500/30 rounded-full" />
        <div className="absolute bottom-4 left-4 w-16 h-16 border border-accent-500/30 rounded-full" />
        <div className="absolute top-1/2 left-1/2 w-12 h-12 border border-success-500/30 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${getCategoryColor()}`}>
            {getCategoryIcon()}
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            AI Insight
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
              {title}
            </h3>
            <div className="text-2xl font-bold text-white mt-2">
              {value}
            </div>
          </div>

          <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
            {description}
          </p>

          {/* AI Badge */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <Brain className="w-4 h-4 text-primary-400" />
            <span className="text-xs text-primary-400 font-medium">
              Genereret af TekUp AI
            </span>
          </div>
        </div>
      </div>

      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-transparent to-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  )
}
