import { 
  Database, 
  Cloud, 
  CreditCard, 
  Mail, 
  Shield, 
  Smartphone,
  Zap,
  ArrowRight
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const integrations = [
  {
    name: "Supabase",
    icon: Database,
    category: "Database & Auth",
    description: "Real-time database og authentication",
    color: "from-green-500 to-green-600"
  },
  {
    name: "Google Cloud",
    icon: Cloud,
    category: "Cloud Platform",
    description: "Skalerbar cloud infrastruktur",
    color: "from-blue-500 to-blue-600"
  },
  {
    name: "Stripe",
    icon: CreditCard,
    category: "Payment Processing",
    description: "Sikker betalingsløsning",
    color: "from-purple-500 to-purple-600"
  },
  {
    name: "SendGrid",
    icon: Mail,
    category: "Email Services",
    description: "Enterprise email automation",
    color: "from-cyan-500 to-cyan-600"
  },
  {
    name: "Auth0",
    icon: Shield,
    category: "Identity Management",
    description: "Avanceret identitetsstyring",
    color: "from-orange-500 to-orange-600"
  },
  {
    name: "Twilio",
    icon: Smartphone,
    category: "Communication",
    description: "SMS og voice integration",
    color: "from-red-500 to-red-600"
  }
];

const IntegrationsSection = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-ecosystem-dark to-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-neon-blue/10 px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4 text-neon-blue" />
            <span className="text-sm font-semibold text-neon-blue uppercase tracking-wide">
              Integrationer
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-foreground mb-6">
            Vi forbinder
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-cyan">
              {" "}alting
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            TekUp fungerer som det centrale nervesystem der forbinder alle jeres 
            eksisterende værktøjer og platforme i et sammenhængende økosystem.
          </p>
        </div>

        {/* Integration Flow Visualization */}
        <div className="mb-16">
          <div className="glass-card p-8 relative overflow-hidden">
            {/* Animated connection lines */}
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full">
                <defs>
                  <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="hsl(195 100% 50%)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                {[...Array(6)].map((_, i) => (
                  <g key={i}>
                    <circle
                      cx={`${20 + i * 12}%`}
                      cy="50%"
                      r="3"
                      fill="hsl(195 100% 50%)"
                      className="animate-pulse-neon"
                      style={{ animationDelay: `${i * 0.3}s` }}
                    />
                    {i < 5 && (
                      <line
                        x1={`${20 + i * 12 + 2}%`}
                        y1="50%"
                        x2={`${20 + (i + 1) * 12 - 2}%`}
                        y2="50%"
                        stroke="url(#flowGradient)"
                        strokeWidth="2"
                        className="animate-data-flow"
                        style={{ animationDelay: `${i * 0.5}s` }}
                      />
                    )}
                  </g>
                ))}
              </svg>
            </div>
            
            <div className="relative z-10 text-center">
              <h3 className="text-2xl font-orbitron font-bold text-foreground mb-4">
                Unified Integration Platform
              </h3>
              <p className="text-muted-foreground">
                En API forbinder alle jeres systemer gennem TekUp's centrale hub
              </p>
            </div>
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {integrations.map((integration, index) => (
            <Card 
              key={index}
              className="group glass-card p-6 ecosystem-hover border-glass-border/30 relative overflow-hidden"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${integration.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                {/* Icon and Category */}
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-neon-blue/20 rounded-xl">
                    <integration.icon className="w-6 h-6 text-neon-blue" />
                  </div>
                  <Badge variant="outline" className="text-xs bg-glass-border/10 border-glass-border/30">
                    {integration.category}
                  </Badge>
                </div>

                {/* Name and Description */}
                <h3 className="text-xl font-orbitron font-bold text-foreground mb-2">
                  {integration.name}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {integration.description}
                </p>

                {/* Connection Status */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-semibold">Connected</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Enterprise Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <h3 className="text-2xl font-orbitron font-bold text-foreground mb-6">
              Enterprise Integration Features
            </h3>
            <div className="space-y-4">
              {[
                "Real-time data synchronization",
                "Advanced error handling & retry logic",
                "Comprehensive audit logging",
                "Rate limiting & security controls",
                "Custom webhook support",
                "Multi-environment deployment"
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-neon-blue rounded-full" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-8">
            <h3 className="text-2xl font-orbitron font-bold text-foreground mb-6">
              Custom Integration Support
            </h3>
            <p className="text-muted-foreground mb-6">
              Behov for at integrere med legacy systemer eller specialiserede platforme? 
              Vi udvikler skræddersyede integrationer der passer perfekt til jeres setup.
            </p>
            <div className="flex items-center gap-2 text-neon-blue cursor-pointer group">
              <span className="font-semibold">Diskuter jeres integrationsbehov</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;