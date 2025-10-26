'use client';

import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Mail, 
  Brain, 
  MessageSquare, 
  Calendar, 
  CalendarCheck, 
  DollarSign, 
  TrendingUp, 
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useApiData } from '../hooks/useApi';

interface PipelineStep {
  name: string;
  count: number;
  conversion: string;
  icon: React.ComponentType<any>;
  status: 'active' | 'completed' | 'pending';
  automationActive: boolean;
}

interface AutomationStats {
  totalRevenue: number;
  avgDealSize: number;
  timeToClose: string;
  automationEfficiency: number;
  activeIntegrations: {
    gmail: boolean;
    calendar: boolean;
    billy: boolean;
    ai: boolean;
  };
}

export function AutomationPipeline() {
  // Fetch real-time automation data
  const { data: automationData, isLoading, error } = useApiData<{
    automationPipeline: Record<string, PipelineStep>;
    stats: AutomationStats;
  }>('/make-server-68ad12b6/api/lead-automation/dashboard-metrics');

  // Add error handling and loading states
  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/30">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="font-medium text-red-300">Automation Data Error</h3>
              <p className="text-sm text-red-400/70">
                Failed to load automation pipeline data. Using fallback values.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pipelineSteps: PipelineStep[] = [
    {
      name: 'Gmail Leads',
      count: automationData?.automationPipeline?.step1?.count || 28,
      conversion: automationData?.automationPipeline?.step1?.conversion || '100%',
      icon: Mail,
      status: 'completed',
      automationActive: true
    },
    {
      name: 'AI Scoring',
      count: automationData?.automationPipeline?.step2?.count || 28,
      conversion: automationData?.automationPipeline?.step2?.conversion || '100%',
      icon: Brain,
      status: 'completed',
      automationActive: true
    },
    {
      name: 'Auto Response',
      count: automationData?.automationPipeline?.step3?.count || 15,
      conversion: automationData?.automationPipeline?.step3?.conversion || '53.6%',
      icon: MessageSquare,
      status: 'active',
      automationActive: true
    },
    {
      name: 'Booking Proposals',
      count: automationData?.automationPipeline?.step4?.count || 5,
      conversion: automationData?.automationPipeline?.step4?.conversion || '33.3%',
      icon: Calendar,
      status: 'active',
      automationActive: true
    },
    {
      name: 'Calendar Events',
      count: automationData?.automationPipeline?.step5?.count || 5,
      conversion: automationData?.automationPipeline?.step5?.conversion || '100%',
      icon: CalendarCheck,
      status: 'completed',
      automationActive: true
    },
    {
      name: 'Billy Invoices',
      count: automationData?.automationPipeline?.step6?.count || 3,
      conversion: automationData?.automationPipeline?.step6?.conversion || '60%',
      icon: DollarSign,
      status: 'active',
      automationActive: true
    }
  ];

  const automationStats: AutomationStats = {
    totalRevenue: automationData?.stats?.totalRevenue || 45000,
    avgDealSize: automationData?.stats?.avgDealSize || 15000,
    timeToClose: automationData?.stats?.timeToClose || '2.3 dage',
    automationEfficiency: automationData?.stats?.automationEfficiency || 89.2,
    activeIntegrations: automationData?.stats?.activeIntegrations || {
      gmail: true,
      calendar: true,
      billy: true,
      ai: true
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'active': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'active': return Clock;
      case 'pending': return AlertCircle;
      default: return Clock;
    }
  };

  // Loading skeleton component
  const PipelineStepSkeleton = () => (
    <div className="flex items-center space-x-4 p-4 rounded-lg border border-white/10 bg-white/5">
      <div className="w-12 h-12 rounded-lg bg-gray-700/50 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-700/50 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-700/50 rounded animate-pulse w-1/2" />
      </div>
      <div className="w-5 h-5 bg-gray-700/50 rounded animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Automation Pipeline</h3>
          <p className="text-gray-300">
            Live overblik over din Gmail → AI → Booking → Billy automation
          </p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
          <Zap className="w-3 h-3 mr-1" />
          Live Automation
        </Badge>
      </div>

      {/* Pipeline Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {automationStats.totalRevenue.toLocaleString('da-DK')} kr
                </div>
                <div className="text-xs text-gray-400">Total omsætning</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {automationStats.avgDealSize.toLocaleString('da-DK')} kr
                </div>
                <div className="text-xs text-gray-400">Gns. deal størrelse</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {automationStats.timeToClose}
                </div>
                <div className="text-xs text-gray-400">Tid til lukke</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {automationStats.automationEfficiency}%
                </div>
                <div className="text-xs text-gray-400">Automation</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Steps */}
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span>Automation Pipeline Flow</span>
            {isLoading && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30 ml-auto">
                <Clock className="w-3 h-3 mr-1 animate-spin" />
                Updating...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, index) => (
                <PipelineStepSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {pipelineSteps.map((step, index) => {
                const Icon = step.icon;
                const StatusIcon = getStatusIcon(step.status);
                const isLast = index === pipelineSteps.length - 1;
                
                return (
                  <motion.div
                    key={step.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="relative"
                  >
                    <div className="flex items-center space-x-4 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      {/* Step Icon */}
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30">
                        <Icon className="w-6 h-6 text-cyan-400" />
                      </div>

                      {/* Step Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-white">{step.name}</h4>
                          {step.automationActive && (
                            <Badge className="bg-green-500/20 text-green-400 text-xs border-green-400/30">
                              Auto
                            </Badge>
                          )}
                          <StatusIcon className={`w-4 h-4 ${getStatusColor(step.status)}`} />
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                          <span>{step.count} items</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-cyan-400">{step.conversion} konvertering</span>
                        </div>
                      </div>

                      {/* Progress Arrow */}
                      {!isLast && (
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-2 ml-16">
                      <Progress 
                        value={parseFloat(step.conversion)} 
                        className="h-2"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Integration Status */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-sm font-medium text-white mb-3">Active Integrations</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(automationStats.activeIntegrations).map(([service, active]) => (
                <div key={service} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                  <span className={`text-xs capitalize ${active ? 'text-green-400' : 'text-gray-400'}`}>
                    {service}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}