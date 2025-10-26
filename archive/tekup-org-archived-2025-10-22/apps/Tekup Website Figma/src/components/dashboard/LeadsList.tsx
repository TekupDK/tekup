'use client';

import { motion } from 'motion/react';
import { getLeadStatusColor, getLeadPriorityText } from '../../utils/lead-scoring-algorithm';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  score: number;
  status: 'hot' | 'warm' | 'cold';
  lastContact?: string;
  value?: number;
  urgency?: 'high' | 'medium' | 'low';
  keywords?: string[];
  phone?: string;
}

interface LeadsListProps {
  leads: Lead[];
  isLoading?: boolean;
  onLeadClick?: (leadId: string) => void;
}

const getStatusStyles = (status: Lead['status']) => {
  switch (status) {
    case 'hot':
      return {
        bgColor: 'bg-gradient-to-r from-red-500/10 to-red-600/10',
        textColor: 'text-[var(--color-lead-hot-fallback)]',
        borderColor: 'border-red-400/30',
        dotColor: 'bg-[var(--color-lead-hot-fallback)]',
        icon: '🔥',
        label: 'Hot lead'
      };
    case 'warm':
      return {
        bgColor: 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10',
        textColor: 'text-[var(--color-lead-warm-fallback)]',
        borderColor: 'border-yellow-400/30',
        dotColor: 'bg-[var(--color-lead-warm-fallback)]',
        icon: '⚡',
        label: 'Warm lead'
      };
    case 'cold':
      return {
        bgColor: 'bg-gradient-to-r from-blue-500/10 to-blue-600/10',
        textColor: 'text-[var(--color-lead-cold-fallback)]',
        borderColor: 'border-blue-400/30',
        dotColor: 'bg-[var(--color-lead-cold-fallback)]',
        icon: '❄️',
        label: 'Cold lead'
      };
    default:
      return {
        bgColor: 'bg-gradient-to-r from-gray-700/30 to-gray-800/30',
        textColor: 'text-gray-400',
        borderColor: 'border-white/5',
        dotColor: 'bg-gray-400',
        icon: '👤',
        label: 'Unknown'
      };
  }
};

const getUrgencyIndicator = (urgency: Lead['urgency'], score: number) => {
  if (urgency === 'high' || score >= 90) return '🚨';
  if (urgency === 'medium' || score >= 70) return '⏰';
  return '📅';
};

function LeadSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-700/30 to-gray-800/30 backdrop-blur border border-white/5">
      <div className="flex-1">
        <div className="animate-pulse bg-white/20 h-4 w-32 mb-2 rounded" />
        <div className="animate-pulse bg-white/10 h-3 w-24 mb-1 rounded" />
        <div className="animate-pulse bg-white/10 h-3 w-16 rounded" />
      </div>
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="animate-pulse bg-white/20 h-4 w-8 mb-1 rounded" />
          <div className="animate-pulse bg-white/10 h-3 w-12 rounded" />
        </div>
        <div className="animate-pulse bg-white/20 w-3 h-3 rounded-full" />
      </div>
    </div>
  );
}

export function LeadsList({ leads, isLoading = false, onLeadClick }: LeadsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-white">Top leads i dag</h4>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <LeadSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-white">Top leads i dag</h4>
        <div className="text-center py-8 text-gray-400">
          <div className="text-2xl mb-2">📭</div>
          <div className="text-sm">Ingen leads fundet i dag</div>
          <div className="text-xs mt-1 text-gray-500">Nye leads vil blive vist her</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">Top leads i dag</h4>
        <div className="text-xs text-gray-400">{leads.length} total</div>
      </div>
      
      <div className="space-y-2">
        {leads.slice(0, 3).map((lead, index) => {
          const config = getStatusStyles(lead.status);
          const urgencyIcon = getUrgencyIndicator(lead.urgency, lead.score);
          
          return (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className={`flex items-center justify-between p-4 rounded-lg ${config.bgColor} backdrop-blur border ${config.borderColor} ${
                onLeadClick ? 'cursor-pointer hover:bg-white/5 transition-all duration-200' : ''
              }`}
              onClick={() => onLeadClick?.(lead.id)}
              whileHover={onLeadClick ? { x: 2, scale: 1.01 } : {}}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm text-white font-medium">
                    {lead.name}
                  </span>
                  <span className="text-xs">{urgencyIcon}</span>
                </div>
                
                <div className="text-xs text-gray-300 mb-1">
                  {lead.company}
                </div>
                
                <div className="flex items-center space-x-2 text-xs">
                  <span className={config.textColor}>{config.icon} {config.label}</span>
                  {lead.lastContact && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">
                        {new Date(lead.lastContact).toLocaleDateString('da-DK', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </>
                  )}
                </div>
                
                {lead.keywords && lead.keywords.length > 0 && (
                  <div className="flex items-center space-x-1 mt-2">
                    {lead.keywords.slice(0, 2).map((keyword, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-1 bg-white/10 rounded-full text-gray-300"
                      >
                        {keyword}
                      </span>
                    ))}
                    {lead.keywords.length > 2 && (
                      <span className="text-xs text-gray-500">+{lead.keywords.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className={`text-lg font-bold ${config.textColor}`}>
                    {lead.score}
                  </div>
                  <div className="text-xs text-gray-400">score</div>
                  {lead.value && (
                    <div className="text-xs text-gray-300 mt-1">
                      {new Intl.NumberFormat('da-DK', {
                        style: 'currency',
                        currency: 'DKK',
                        minimumFractionDigits: 0,
                      }).format(lead.value)}
                    </div>
                  )}
                </div>
                
                <div className={`w-4 h-4 rounded-full ${config.dotColor} shadow-lg animate-pulse`} />
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {leads.length > 3 && (
        <motion.button
          className="w-full text-xs text-gray-400 hover:text-white transition-colors py-3 border border-white/10 rounded-lg hover:bg-white/5"
          whileHover={{ scale: 1.02 }}
          onClick={() => onLeadClick?.('view-all')}
        >
          Se alle {leads.length} leads →
        </motion.button>
      )}
    </div>
  );
}