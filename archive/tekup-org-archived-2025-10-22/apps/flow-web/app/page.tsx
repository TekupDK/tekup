import Link from 'next/link';
import { Zap, Building2, Utensils, Wrench } from 'lucide-react';

export default function Home() {
  const tenants = [
    { 
      id: 'rendetalje', 
      label: 'Rendetalje OS', 
      icon: Wrench,
      description: 'Rengøringsservice platform',
      color: 'text-emerald-400'
    },
    { 
      id: 'foodtruck', 
      label: 'FoodTruck OS', 
      icon: Utensils,
      description: 'Food truck management',
      color: 'text-red-400'
    },
    { 
      id: 'tekup', 
      label: 'TekUp Flow', 
      icon: Building2,
      description: 'Business automation hub',
      color: 'text-neon-blue'
    }
  ];

  return (
    <main className="flow-dashboard">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-neon-blue rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              opacity: 0.3 + Math.random() * 0.4
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto p-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 bg-neon-blue/20 rounded-lg">
              <Zap className="w-8 h-8 text-neon-blue" />
            </div>
            <div>
              <h1 className="text-4xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-cyan">
                TekUp Flow
              </h1>
              <div className="text-sm text-neon-blue/80 uppercase tracking-widest font-semibold">
                Business Automation Ecosystem
              </div>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Vælg en tenant for at åbne dashboardet og få adgang til dit digitale økosystem
          </p>
        </div>
        
        {/* Tenant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tenants.map(tenant => {
            const IconComponent = tenant.icon;
            return (
              <Link
                key={tenant.id}
                href={`/t/${tenant.id}/leads`}
                className="group glass-card p-6 ecosystem-hover neon-glow ripple"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-4 rounded-xl bg-glass-border/10 ${tenant.color} transition-colors group-hover:scale-110`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-orbitron font-semibold text-foreground group-hover:text-neon-blue transition-colors">
                      {tenant.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tenant.description}
                    </p>
                  </div>
                  
                  <div className="text-xs text-neon-blue/60 font-mono bg-glass-border/10 px-3 py-1 rounded-full">
                    /t/{tenant.id}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        
        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {
            [
              { label: "Active Tenants", value: "3" },
              { label: "Total Leads", value: "1.2K+" },
              { label: "Integrations", value: "25+" },
              { label: "Uptime", value: "99.9%" }
            ].map((stat, index) => (
              <div key={index} className="dashboard-card text-center">
                <div className="dashboard-stat-value">
                  {stat.value}
                </div>
                <div className="dashboard-stat-label">
                  {stat.label}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </main>
  );
}
