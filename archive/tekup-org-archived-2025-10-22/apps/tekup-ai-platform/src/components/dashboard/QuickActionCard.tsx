import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

interface QuickActionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
  delay?: number
}

export default function QuickActionCard({
  title,
  description,
  icon,
  href,
  color,
  delay = 0
}: QuickActionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group"
    >
      <Link to={href} className="block">
        <div className="card-glass hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] relative overflow-hidden">
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity`} />
          
          {/* Content */}
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div className={`p-3 bg-gradient-to-br ${color} rounded-xl text-white shadow-lg`}>
              {icon}
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </div>

          <div className="relative z-10 space-y-2">
            <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
              {description}
            </p>
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </div>
      </Link>
    </motion.div>
  )
}
