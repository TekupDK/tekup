'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
  TrendingUp,
  Mail,
  Brain,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useApiData, useApi } from '../hooks/useApi';
import { toast } from 'sonner@2.0.3';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  category: 'lead' | 'response' | 'booking' | 'invoice';
  icon: React.ComponentType<any>;
  performance: {
    success: number;
    total: number;
    avgTime: string;
  };
}

interface AutomationHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: string;
  lastRun: string;
  nextRun: string;
  totalProcessed: number;
  errors: number;
}

export function AutomationControlPanel() {
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const { post } = useApi();
  
  // Fetch automation rules and health data
  const { data: rulesData, isLoading: rulesLoading, refresh: refreshRules } = useApiData<{
    rules: AutomationRule[];
    health: AutomationHealth;
  }>('/make-server-68ad12b6/api/automation/control-panel');

  const automationRules: AutomationRule[] = rulesData?.rules || [
    {
      id: 'gmail-sync',
      name: 'Gmail Lead Sync',
      description: 'Automatically sync new leads from Gmail',
      isActive: true,
      category: 'lead',
      icon: Mail,
      performance: { success: 127, total: 134, avgTime: '2.3s' }
    },
    {
      id: 'ai-scoring',
      name: 'AI Lead Scoring',
      description: 'Score leads using AI analysis',
      isActive: true,
      category: 'lead',
      icon: Brain,
      performance: { success: 128, total: 134, avgTime: '1.8s' }
    },
    {
      id: 'auto-response',
      name: 'Auto Response',
      description: 'Send automated responses to qualified leads',
      isActive: true,
      category: 'response',
      icon: Mail,
      performance: { success: 67, total: 72, avgTime: '0.5s' }
    },
    {
      id: 'booking-automation',
      name: 'Booking Automation',
      description: 'Create calendar events for qualified leads',
      isActive: true,
      category: 'booking',
      icon: Calendar,
      performance: { success: 23, total: 25, avgTime: '3.2s' }
    },
    {
      id: 'invoice-generation',
      name: 'Billy Invoice Generation',
      description: 'Generate invoices in Billy for completed bookings',
      isActive: false,
      category: 'invoice',
      icon: DollarSign,
      performance: { success: 0, total: 0, avgTime: 'N/A' }
    }
  ];

  const healthData: AutomationHealth = rulesData?.health || {
    status: 'healthy',
    uptime: '99.8%',
    lastRun: '2 minutes ago',
    nextRun: 'In 3 minutes',
    totalProcessed: 1247,
    errors: 3
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await post('/make-server-68ad12b6/api/automation/toggle-rule', {
        ruleId,
        isActive: !isActive
      });
      
      toast.success(
        `Automation rule ${!isActive ? 'activated' : 'deactivated'}`,
        {
          description: `${automationRules.find(r => r.id === ruleId)?.name} is now ${!isActive ? 'active' : 'inactive'}`
        }
      );
      
      refreshRules();
    } catch (error) {
      toast.error('Failed to toggle automation rule');
    }
  };

  const handleRunRule = async (ruleId: string) => {
    try {
      await post('/make-server-68ad12b6/api/automation/run-rule', { ruleId });
      
      toast.success('Automation rule triggered', {
        description: 'The rule is now running manually'
      });
      
      refreshRules();
    } catch (error) {
      toast.error('Failed to run automation rule');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';  
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      default: return Activity;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lead': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'response': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'booking': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'invoice': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Automation Control</h3>
          <p className="text-gray-300">
            Manage and monitor your automation rules
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshRules}
            disabled={rulesLoading}
            className="border-white/20 hover:bg-white/10"
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${rulesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge className={getStatusColor(healthData.status)}>
            {React.createElement(getStatusIcon(healthData.status), { className: "w-3 h-3 mr-1" })}
            {healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* System Health */}
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center space-x-2 text-lg">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Uptime</div>
              <div className="text-lg font-bold text-white">{healthData.uptime}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Last Run</div>
              <div className="text-lg font-bold text-white">{healthData.lastRun}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Next Run</div>
              <div className="text-lg font-bold text-white">{healthData.nextRun}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Processed</div>
              <div className="text-lg font-bold text-white">{healthData.totalProcessed.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Automation Rules</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automationRules.map((rule, index) => {
              const Icon = rule.icon;
              const successRate = rule.performance.total > 0 ? 
                (rule.performance.success / rule.performance.total) * 100 : 0;
              
              return (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Rule Icon */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30">
                        <Icon className="w-5 h-5 text-cyan-400" />
                      </div>

                      {/* Rule Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-white">{rule.name}</h4>
                          <Badge className={getCategoryColor(rule.category)}>
                            {rule.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{rule.description}</p>
                        
                        {/* Performance Metrics */}
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>Success: {rule.performance.success}/{rule.performance.total}</span>
                          <span>•</span>
                          <span>Rate: {successRate.toFixed(1)}%</span>
                          <span>•</span>
                          <span>Avg Time: {rule.performance.avgTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center space-x-3">
                      {/* Success Rate Progress */}
                      <div className="w-20">
                        <Progress value={successRate} className="h-2" />
                      </div>
                      
                      {/* Manual Run Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunRule(rule.id)}
                        disabled={!rule.isActive}
                        className="border-white/20 hover:bg-white/10"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      
                      {/* Toggle Switch */}
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggleRule(rule.id, rule.isActive)}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}