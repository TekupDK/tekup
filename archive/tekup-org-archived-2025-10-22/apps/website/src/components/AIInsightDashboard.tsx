import { Activity, Brain, Cpu, Maximize2, Settings, TrendingUp, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

interface AIInsightDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AIMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: React.ComponentType<any>;
}

interface BusinessNode {
  id: number;
  x: number;
  y: number;
  connections: number[];
  active: boolean;
  strength: number;
}

const AIInsightDashboard: React.FC<AIInsightDashboardProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<AIMetric[]>([
    {
      id: 'processing_power',
      name: 'Databehandling',
      value: 95,
      unit: '%',
      trend: 'up',
      color: 'var(--ai-primary)',
      icon: Brain
    },
    {
      id: 'business_ops',
      name: 'Forretningsoperationer',
      value: 99.7,
      unit: '%',
      trend: 'stable',
      color: 'var(--ai-secondary)',
      icon: Zap
    },
    {
      id: 'consciousness',
      name: 'Consciousness Level',
      value: 94.3,
      unit: '%',
      trend: 'up',
      color: 'var(--ai-accent)',
      icon: Activity
    },
    {
      id: 'efficiency',
      name: 'Effektivitet',
      value: 92.4,
      unit: '%',
      trend: 'up',
      color: 'var(--holo-1)',
      icon: TrendingUp
    }
  ]);

  const [businessNodes, setBusinessNodes] = useState<BusinessNode[]>([]);
  const [activeConnections, setActiveConnections] = useState<Set<string>>(new Set());

  // Initialize business network nodes
  useEffect(() => {
    const nodes: BusinessNode[] = [];
    const gridSize = 8;
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      nodes.push({
        id: i,
        x: (col / (gridSize - 1)) * 100,
        y: (row / (gridSize - 1)) * 100,
        connections: [],
        active: Math.random() > 0.3,
        strength: Math.random()
      });
    }

    // Create connections
    nodes.forEach(node => {
      const connections = Math.floor(Math.random() * 4) + 1;
      for (let j = 0; j < connections; j++) {
        const targetId = Math.floor(Math.random() * nodes.length);
        if (targetId !== node.id && !node.connections.includes(targetId)) {
          node.connections.push(targetId);
        }
      }
    });

    setBusinessNodes(nodes);
  }, []);

  // Simulate real-time data updates
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * (metric.value * 0.02),
        trend: Math.random() > 0.7 ? 
          (Math.random() > 0.5 ? 'up' : 'down') : 
          metric.trend
      })));

      // Update business network activity
      setBusinessNodes(prev => prev.map(node => ({
        ...node,
        active: Math.random() > 0.4,
        strength: Math.random()
      })));

      // Update active connections
      const newConnections = new Set<string>();
      businessNodes.forEach(node => {
        if (node.active) {
          node.connections.forEach(targetId => {
            if (businessNodes[targetId]?.active) {
              const connectionKey = `${node.id}-${targetId}`;
              newConnections.add(connectionKey);
            }
          });
        }
      });
      setActiveConnections(newConnections);
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, businessNodes]);

  if (!isOpen) return null;

  const formatValue = (value: number, unit: string) => {
    if (unit === '∞') return '∞';
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'TOPS' || unit === 'GFLOPS') return `${value.toFixed(0)}`;
    return value.toFixed(2);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#4ade80';
      case 'down': return '#f87171';
      default: return '#94a3b8';
    }
  };

  const getTrendSymbol = (trend: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-full max-h-[90vh] bg-[var(--surface-base)] neo-elevated rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[var(--ai-primary)] to-[var(--ai-secondary)] flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Business Intelligence Dashboard</h2>
              <p className="text-sm text-white/60">Realtids forretningsovervågning</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-white/60 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="text-white/60 hover:text-white">
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 h-full overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            
            {/* Metrics Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[var(--ai-accent)]" />
                  System Metrics
                </h3>
                
                <div className="space-y-4">
                  {metrics.map((metric) => {
                    const IconComponent = metric.icon;
                    return (
                      <div key={metric.id} className="neo-elevated p-4 holo-shimmer">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IconComponent 
                              className="w-4 h-4" 
                              style={{ color: metric.color }}
                            />
                            <span className="text-sm text-white/80">{metric.name}</span>
                          </div>
                          <span 
                            className="text-xs font-mono px-2 py-1 rounded"
                            style={{ 
                              color: getTrendColor(metric.trend),
                              backgroundColor: `${getTrendColor(metric.trend)}20`
                            }}
                          >
                            {getTrendSymbol(metric.trend)}
                          </span>
                        </div>
                        
                        <div className="flex items-baseline gap-1">
                          <span 
                            className="text-2xl font-mono font-bold"
                            style={{ 
                              color: metric.color,
                              textShadow: `0 0 10px ${metric.color}`
                            }}
                          >
                            {formatValue(metric.value, metric.unit)}
                          </span>
                          <span className="text-xs text-white/60 ml-1">
                            {metric.unit !== '∞' && metric.unit}
                          </span>
                        </div>

                        {/* Mini progress bar */}
                        <div className="mt-3 h-1 bg-white/10 rounded overflow-hidden">
                          <div 
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (metric.value / 200) * 100)}%`,
                              background: `linear-gradient(90deg, ${metric.color}, ${metric.color}80)`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* System Status */}
              <div className="neo-elevated p-4">
                <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[var(--ai-secondary)]" />
                  System Status
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Tilgængelighed</span>
                    <span className="text-[var(--holo-1)]">Aktiv</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Superposition</span>
                    <span className="text-[var(--ai-primary)]">Stable</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Coherence Time</span>
                    <span className="text-[var(--ai-accent)]">847μs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Network Visualization */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[var(--ai-primary)]" />
                Forretningsnetværk Aktivitet
              </h3>
              
              <div className="neo-elevated p-6 h-96 relative overflow-hidden">
                <svg className="absolute inset-0 w-full h-full">
                  {/* Render connections */}
                  {businessNodes.map(node => 
                    node.connections.map(targetId => {
                      const target = businessNodes[targetId];
                      if (!target) return null;
                      
                      const connectionKey = `${node.id}-${targetId}`;
                      const isActive = activeConnections.has(connectionKey);
                      
                      return (
                        <line
                          key={connectionKey}
                          x1={`${node.x}%`}
                          y1={`${node.y}%`}
                          x2={`${target.x}%`}
                          y2={`${target.y}%`}
                          stroke={isActive ? 'var(--ai-primary)' : 'rgba(255,255,255,0.1)'}
                          strokeWidth={isActive ? '2' : '1'}
                          opacity={isActive ? 0.8 : 0.3}
                          className="transition-all duration-300"
                        />
                      );
                    })
                  )}
                  
                  {/* Render nodes */}
                  {businessNodes.map(node => (
                    <circle
                      key={node.id}
                      cx={`${node.x}%`}
                      cy={`${node.y}%`}
                      r={node.active ? '4' : '2'}
                      fill={node.active ? 'var(--ai-accent)' : 'rgba(255,255,255,0.3)'}
                      className="transition-all duration-300"
                      style={{
                        filter: node.active ? `drop-shadow(0 0 8px var(--ai-accent))` : 'none'
                      }}
                    />
                  ))}
                </svg>
                
                {/* Overlay info */}
                <div className="absolute top-4 right-4 neo-sunken p-3 bg-black/50">
                  <div className="text-xs text-white/60 space-y-1">
                    <div>Active Nodes: {businessNodes.filter(n => n.active).length}/{businessNodes.length}</div>
                    <div>Connections: {activeConnections.size}</div>
                    <div>Network Load: {((activeConnections.size / 100) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightDashboard;