import {
    BarChart3,
    Brain,
    Cpu,
    Database,
    Network,
    Shield,
    Sparkles,
    TrendingUp,
    Users,
    Zap
} from "lucide-react";
import { useState } from "react";
import CRMWidget from "./CRMWidget";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: any;
  color: string;
  delay: number;
}

const MetricCard = ({ title, value, change, icon: Icon, color, delay }: MetricCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="neo-elevated p-6 rounded-xl transition-all duration-500 cursor-pointer group"
      style={{ 
        animationDelay: `${delay}ms`,
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Holographic Accent */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, ${color}, transparent)`,
        }}
      />
      
      {/* Icon with Glow */}
      <div className="flex items-center justify-between mb-4">
        <div 
          className="p-3 rounded-full transition-all duration-300"
          style={{
            backgroundColor: `${color}20`,
            boxShadow: isHovered ? `0 0 30px ${color}40` : `0 0 15px ${color}20`,
          }}
        >
          <Icon 
            className="w-6 h-6 transition-all duration-300"
            style={{ 
              color,
              filter: `drop-shadow(0 0 10px ${color})`,
            }}
          />
        </div>
        
        {/* AI Status Indicator */}
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-white/50 font-mono">LIVE</span>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="space-y-2">
        <h3 className="text-white/80 text-sm font-medium tracking-wide">
          {title}
        </h3>
        <p 
          className="text-3xl font-bold font-mono transition-colors duration-300"
          style={{ color: isHovered ? color : 'white' }}
        >
          {value}
        </p>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm font-medium">
            {change}
          </span>
          <span className="text-white/40 text-sm">vs last period</span>
        </div>
      </div>
      
      {/* Neural Network Pattern */}
      <div className="absolute bottom-2 right-2 opacity-10 group-hover:opacity-30 transition-opacity duration-500">
        <div className="neural-network w-12 h-12" />
      </div>
    </div>
  );
};

interface AIInsightProps {
  title: string;
  insight: string;
  confidence: number;
  delay: number;
}

const AIInsight = ({ title, insight, confidence, delay }: AIInsightProps) => (
  <div 
    className="neo-sunken p-4 rounded-lg transition-all duration-500 hover:neo-elevated cursor-pointer physics-float"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-2">
        <Brain className="w-4 h-4 text-[var(--ai-accent)]" />
        <h4 className="text-white/90 font-medium text-sm">{title}</h4>
      </div>
      <div className="flex items-center space-x-1">
        <Sparkles className="w-3 h-3 text-[var(--holo-1)]" />
        <span className="text-xs font-mono text-[var(--holo-1)]">
          {confidence}% confident
        </span>
      </div>
    </div>
    <p className="text-white/70 text-sm leading-relaxed">{insight}</p>
    
    {/* Confidence Bar */}
    <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-[var(--ai-accent)] to-[var(--holo-1)] rounded-full transition-all duration-1000"
        style={{ width: `${confidence}%` }}
      />
    </div>
  </div>
);

const TekUp2025Dashboard = () => {
  const metrics = [
    {
      title: "AI Models Active",
      value: "847",
      change: "+12.5%",
      icon: Brain,
      color: "var(--ai-primary)",
      delay: 100,
    },
    {
      title: "Neural Processing",
      value: "2.4 EH/s",
      change: "+8.2%",
      icon: Cpu,
      color: "var(--ai-secondary)",
      delay: 200,
    },
    {
      title: "Quantum Coherence",
      value: "98.7%",
      change: "+0.3%",
      icon: Zap,
      color: "var(--ai-accent)",
      delay: 300,
    },
    {
      title: "Active Users",
      value: "1.2M",
      change: "+23.1%",
      icon: Users,
      color: "var(--holo-1)",
      delay: 400,
    },
    {
      title: "Data Streams",
      value: "847K",
      change: "+15.7%",
      icon: Database,
      color: "var(--holo-2)",
      delay: 500,
    },
    {
      title: "Network Nodes",
      value: "12.4K",
      change: "+5.9%",
      icon: Network,
      color: "var(--holo-3)",
      delay: 600,
    },
  ];

  const aiInsights = [
    {
      title: "Performance Optimization",
      insight: "AI models are operating 23% more efficiently after quantum optimization protocols were implemented.",
      confidence: 94,
      delay: 700,
    },
    {
      title: "Predictive Analytics",
      insight: "User engagement is predicted to increase by 18% in the next quarter based on current behavioral patterns.",
      confidence: 87,
      delay: 800,
    },
    {
      title: "Security Anomaly",
      insight: "Neural firewall detected and neutralized 12 potential threats in the last 24 hours.",
      confidence: 99,
      delay: 900,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface-base)] neural-network">
      {/* Ambient Background */}
      <div className="absolute inset-0 ambient-focus opacity-5" />
      <div className="absolute inset-0 fluid-gradient opacity-5" />
      
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black font-mono mb-4">
            <span className="fluid-gradient bg-clip-text text-transparent">
              AI Command Center
            </span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Real-time monitoring of TekUp's neural networks, quantum processors, and AI ecosystems
          </p>
          
          {/* Status Indicator */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-medium">All Systems Operational</span>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-[var(--ai-accent)]" />
              <span className="text-white/70 text-sm">Quantum Secured</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* CRM Widget */}
        <div className="mb-16">
          <div className="flex items-center space-x-3 mb-8">
            <Users className="w-6 h-6 text-[var(--ai-accent)]" />
            <h2 className="text-2xl font-bold text-white">Customer Management</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[var(--ai-accent)] to-transparent" />
          </div>
          
          <CRMWidget />
        </div>

        {/* AI Insights Section */}
        <div className="mb-16">
          <div className="flex items-center space-x-3 mb-8">
            <Brain className="w-6 h-6 text-[var(--ai-accent)]" />
            <h2 className="text-2xl font-bold text-white">AI Insights</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[var(--ai-accent)] to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {aiInsights.map((insight, index) => (
              <AIInsight key={index} {...insight} />
            ))}
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="neo-elevated p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Neural Network Performance</h3>
            <div className="flex items-center space-x-4">
              <BarChart3 className="w-5 h-5 text-[var(--ai-accent)]" />
              <span className="text-sm text-white/60">Real-time Analytics</span>
            </div>
          </div>
          
          {/* Simulated Chart Area */}
          <div className="h-64 neo-sunken rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="holo-shimmer w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-[var(--ai-accent)]" />
              </div>
              <p className="text-white/60">Interactive holographic charts loading...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TekUp2025Dashboard;