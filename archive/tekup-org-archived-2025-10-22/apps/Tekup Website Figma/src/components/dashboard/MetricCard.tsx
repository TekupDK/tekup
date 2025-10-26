'use client';

import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  value: string | number;
  label: string;
  icon: LucideIcon;
  color: 'emerald' | 'cyan' | 'purple' | 'green' | 'tekup-primary' | 'tekup-accent' | 'tekup-success';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  isLoading?: boolean;
  priority?: 'hot' | 'warm' | 'cold';
}

const colorClasses = {
  emerald: 'text-emerald-400',
  cyan: 'text-cyan-400', 
  purple: 'text-purple-400',
  green: 'text-green-400',
  'tekup-primary': 'text-[var(--color-tekup-primary-fallback)]',
  'tekup-accent': 'text-[var(--color-tekup-accent-fallback)]',
  'tekup-success': 'text-[var(--color-tekup-success-fallback)]',
};

const priorityColors = {
  hot: 'text-[var(--color-lead-hot-fallback)] bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-400/30',
  warm: 'text-[var(--color-lead-warm-fallback)] bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-400/30',
  cold: 'text-[var(--color-lead-cold-fallback)] bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30',
};

export function MetricCard({ 
  value, 
  label, 
  icon: Icon, 
  color, 
  trend,
  isLoading = false,
  priority
}: MetricCardProps) {
  const cardClass = priority 
    ? `${priorityColors[priority]} border` 
    : 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 backdrop-blur border border-white/5';
  
  const iconColorClass = priority ? priorityColors[priority].split(' ')[0] : colorClasses[color];
  const valueColorClass = priority ? priorityColors[priority].split(' ')[0] : colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`${cardClass} rounded-xl p-4 text-center hover-scale smooth-3d`}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <Icon className={`w-6 h-6 mx-auto mb-3 ${iconColorClass}`} />
      
      <div className={`text-2xl font-bold mb-1 ${valueColorClass}`}>
        {isLoading ? (
          <div className="animate-pulse bg-white/20 h-8 w-12 mx-auto rounded" />
        ) : (
          <motion.span
            key={value}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.span>
        )}
      </div>
      
      <div className="text-xs text-gray-400 mb-2">{label}</div>
      
      {trend && (
        <motion.div 
          className={`text-xs flex items-center justify-center space-x-1 ${
            trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span>{trend.direction === 'up' ? '↗' : '↘'}</span>
          <span>{Math.abs(trend.value)}%</span>
        </motion.div>
      )}
      
      {priority && (
        <motion.div 
          className="text-xs mt-2 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {priority === 'hot' && '🔥 Hot Lead'}
          {priority === 'warm' && '⚡ Warm Lead'}
          {priority === 'cold' && '❄️ Cold Lead'}
        </motion.div>
      )}
    </motion.div>
  );
}