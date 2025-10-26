'use client';

import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MetricCard } from './MetricCard';
import { LeadsList } from './LeadsList';
import { useDashboardData } from '../../hooks/useDashboardData';
import { TrendingUp, Users, Zap, Shield, RefreshCw, ExternalLink } from 'lucide-react';

interface DashboardOverviewProps {
  onLeadClick?: (leadId: string) => void;
}

export function DashboardOverview({ onLeadClick }: DashboardOverviewProps) {
  const { metrics, leads, isLoading, lastUpdated, refresh } = useDashboardData();

  // Debug log for troubleshooting
  console.log('🔍 Dashboard Debug:', {
    isLoading,
    metricsExists: !!metrics,
    leadsCount: leads?.length || 0,
    lastUpdated
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Dashboard Overblik</h2>
          <p className="text-gray-300">
            Real-time indsigt i dine leads og CRM performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-xs text-gray-400">
            Sidste opdatering: {lastUpdated?.toLocaleTimeString('da-DK')}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Opdater
          </Button>
        </div>
      </div>

      {/* Main Dashboard Card - Matching Figma Design */}
      <motion.div 
        className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover-lift smooth-3d shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        whileHover={{ rotateY: 1, rotateX: 1 }}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-lg">Tekup Dashboard</h3>
            <Badge className="bg-emerald-500 text-white px-3 py-1 rounded-full shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
              Live
            </Badge>
          </div>
          
          {/* Stats Grid - Matching Figma Layout */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              value={metrics?.newLeads || 0}
              label="Nye leads"
              icon={TrendingUp}
              color="emerald"
              trend={metrics?.trends.newLeads}
              isLoading={isLoading}
            />
            
            <MetricCard
              value={`${metrics?.conversionRate || 0}%`}
              label="Konvertering"
              icon={Users}
              color="cyan"
              trend={metrics?.trends.conversionRate}
              isLoading={isLoading}
            />
            
            <MetricCard
              value={metrics?.aiScore || 0}
              label="AI Score"
              icon={Zap}
              color="purple"
              trend={metrics?.trends.aiScore}
              isLoading={isLoading}
            />
            
            <MetricCard
              value={metrics?.liveStatus || 'Loading...'}
              label="Live Status"
              icon={Shield}
              color="green"
              isLoading={isLoading}
            />
          </div>
          
          {/* Leads List - Matching Figma Design */}
          <LeadsList 
            leads={leads || []}
            isLoading={isLoading}
            onLeadClick={onLeadClick}
          />
          
          {/* Bottom status */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">
                {metrics?.uptime || '99.9%'} uptime
              </span>
            </div>
            <span className="text-xs text-gray-400">
              Sidste opdatering: {lastUpdated?.toLocaleTimeString('da-DK') || 'Nu'}
            </span>
          </div>
        </div>

        {/* Enhanced Floating Notifications - Matching Figma */}
        <motion.div 
          className="absolute -top-6 -right-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-3 shadow-lg hover-scale smooth-3d border border-white/20"
          initial={{ opacity: 0, scale: 0, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
          whileHover={{ rotate: 2, scale: 1.05 }}
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-bold text-white">
              {metrics?.newLeads || 2} nye leads
            </span>
          </div>
        </motion.div>
        
        <motion.div 
          className="absolute -bottom-6 -left-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-3 shadow-lg hover-scale smooth-3d border border-white/20"
          initial={{ opacity: 0, scale: 0, rotate: 10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 1, duration: 0.5, type: "spring" }}
          whileHover={{ rotate: -2, scale: 1.05 }}
        >
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white">Live monitoring</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Additional Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => onLeadClick?.('new-lead')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Tilføj nyt lead
          </Button>
          
          <Button
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => onLeadClick?.('view-analytics')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Se detaljeret analytics
          </Button>
        </div>

        <div className="text-xs text-gray-400">
          Dashboard version: v2.4.1 | API Status: 
          <span className="text-emerald-400 ml-1">Healthy</span>
        </div>
      </div>
    </div>
  );
}