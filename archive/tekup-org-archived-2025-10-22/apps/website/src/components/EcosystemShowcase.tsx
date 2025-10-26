import { 
  Building2, 
  Home, 
  Bot, 
  Shield, 
  Cloud, 
  Smartphone,
  ExternalLink,
  Zap
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const projects = [
  {
    name: "Workplace Deployment",
    description: "Effektiv implementering og administration af moderne arbejdspladser",
    icon: Building2,
    status: "Live",
    tech: ["Windows 11", "Microsoft 365", "MDM"],
    features: ["Hardware Setup", "Software Installation", "Brugertræning"]
  },
  {
    name: "IT-Support & Service",
    description: "Professionel IT-support med hurtig responstid og høj kvalitet",
    icon: Home,
    status: "Live",
    tech: ["ServiceDesk", "Monitoring", "ITIL"],
    features: ["24/7 Support", "Remote Assistance", "On-site Service"]
  },
  {
    name: "Netværksløsninger",
    description: "Robust og fremtidssikret netværksinfrastruktur til din virksomhed",
    icon: Bot,
    status: "Live",
    tech: ["Cisco", "Fortinet", "Meraki"],
    features: ["Network Design", "SD-WAN", "WiFi 6"]
  },
  {
    name: "A-Z Rådgivning",
    description: "Omfattende IT-rådgivning der sikrer din digitale transformation",
    icon: Shield,
    status: "Live",
    tech: ["Consulting", "Strategy", "ROI"],
    features: ["Digital Strategi", "Projektledelse", "Change Management"]
  },
  {
    name: "Cloud Løsninger",
    description: "Sikker migration og drift af cloud-baserede løsninger",
    icon: Cloud,
    status: "Live",
    tech: ["Azure", "Microsoft 365", "Backup"],
    features: ["Azure Migration", "Hybrid Cloud", "Data Sikkerhed"]
  },
  {
    name: "Sikkerhed & Backup",
    description: "Enterprise-grade sikkerhed og pålidelig backup løsning",
    icon: Smartphone,
    status: "Live",
    tech: ["Defender", "Veeam", "MFA"],
    features: ["Endpoint Security", "Backup & Recovery", "Compliance"]
  }
];

const EcosystemShowcase = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background to-ecosystem-dark">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-blue/10 to-neon-cyan/10 px-4 py-2 rounded-full mb-6 glass border border-neon-blue/20 hover:bg-neon-blue/20 hover:scale-105 transition-all duration-300 cursor-pointer">
            <Zap className="w-4 h-4 text-neon-blue animate-pulse" />
            <span className="text-sm font-semibold text-neon-blue uppercase tracking-wide">
              TekUp Økosystem
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-foreground mb-6 animate-fade-in-up">
            Vores IT
            <span className="text-transparent bg-clip-text bg-gradient-x animate-gradient-x">
              {" "}Services
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Omfattende IT-løsninger der sørger for at din virksomhed kører optimalt.
            Fra deployment til support - vi håndterer hele jeres IT-landskab.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Card 
              key={index}
              className="group glass-card p-6 border-glass-border/30 relative overflow-hidden transition-all duration-700 hover:scale-105 hover:shadow-neon-lg cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Enhanced background glow with multiple layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 via-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-neon-blue/5 to-transparent opacity-0 group-hover:opacity-80 transition-all duration-500 animate-glow-pulse" />
              
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-lg border border-neon-blue/30 opacity-0 group-hover:opacity-100 animate-glow-pulse transition-all duration-500" />
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-neon-blue/10 to-transparent transition-transform duration-1000" />
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-neon-blue/20 to-neon-cyan/10 rounded-xl group-hover:bg-gradient-to-br group-hover:from-neon-blue/30 group-hover:to-neon-cyan/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 relative">
                      <project.icon className="w-6 h-6 text-neon-blue group-hover:text-neon-cyan transition-colors duration-300" />
                      {/* Icon glow on hover */}
                      <div className="absolute inset-0 rounded-xl bg-neon-blue/20 opacity-0 group-hover:opacity-100 animate-glow-pulse transition-opacity duration-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-orbitron font-bold text-foreground group-hover:text-neon-blue transition-colors duration-300">
                        {project.name}
                      </h3>
                      <Badge 
                        variant={project.status === 'Live' ? 'default' : 'secondary'}
                        className={`text-xs transition-all duration-300 group-hover:scale-105 ${
                          project.status === 'Live' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30 group-hover:bg-green-500/30 group-hover:shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                            : project.status === 'Beta'
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 group-hover:bg-yellow-500/30 group-hover:shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30 group-hover:bg-blue-500/30 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                        }`}
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-neon-cyan transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                </div>

                {/* Description */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {project.description}
                </p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide group-hover:text-neon-blue transition-colors duration-300">
                    Key Features
                  </h4>
                  <div className="space-y-2">
                    {project.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300" style={{ transitionDelay: `${idx * 50}ms` }}>
                        <div className="w-1.5 h-1.5 bg-neon-blue rounded-full group-hover:bg-neon-cyan group-hover:scale-125 group-hover:shadow-[0_0_8px_hsl(195_100%_50%)] transition-all duration-300" />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech, idx) => (
                    <Badge 
                      key={idx}
                      variant="outline"
                      className="text-xs bg-glass-border/10 border-glass-border/30 text-muted-foreground hover:bg-neon-blue/10 hover:border-neon-blue/30 hover:text-neon-blue transition-all duration-300 hover:scale-105 group-hover:shadow-[0_0_8px_rgba(0,217,255,0.3)]"
                      style={{ transitionDelay: `${idx * 75}ms` }}
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Connection Visualization */}
        <div className="mt-16 text-center">
          <div className="glass-card p-8 max-w-4xl mx-auto relative overflow-hidden group hover:shadow-neon-lg transition-all duration-700">
            {/* Enhanced background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-neon-blue/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-glow-pulse" />
            
            <div className="relative z-10">
              <h3 className="text-2xl font-orbitron font-bold text-foreground mb-4 group-hover:text-neon-blue transition-colors duration-300">
                Forbundet Økosystem
              </h3>
              <p className="text-muted-foreground mb-6 group-hover:text-foreground transition-colors duration-300">
                Alle vores løsninger er designet til at arbejde sammen gennem fælles API'er, 
                standarder og dataformater.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {[
                  { text: "Unified API", delay: "0ms" },
                  { text: "Single Sign-On", delay: "100ms" },
                  { text: "Shared Analytics", delay: "200ms" },
                  { text: "Cross-Platform Data", delay: "300ms" }
                ].map((item, idx) => (
                  <Badge 
                    key={idx}
                    className="bg-gradient-to-r from-neon-blue/20 to-neon-cyan/20 text-neon-blue border-neon-blue/30 hover:bg-neon-blue/30 hover:scale-105 hover:shadow-[0_0_15px_rgba(0,217,255,0.5)] transition-all duration-300 cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: item.delay }}
                  >
                    {item.text}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Connection lines visualization */}
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <svg className="w-full h-full">
                <defs>
                  <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(195 100% 50%)" />
                    <stop offset="50%" stopColor="hsl(180 100% 50%)" />
                    <stop offset="100%" stopColor="hsl(195 100% 50%)" />
                  </linearGradient>
                </defs>
                {[...Array(4)].map((_, i) => (
                  <line
                    key={i}
                    x1={`${20 + i * 20}%`}
                    y1="30%"
                    x2={`${30 + i * 20}%`}
                    y2="70%"
                    stroke="url(#connectionGradient)"
                    strokeWidth="2"
                    className="animate-glow-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EcosystemShowcase;