import { Shield, Server, Smartphone, MonitorCog, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-6 bg-gradient-to-b from-ecosystem to-background scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-neon-blue/10 px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4 text-neon-blue" />
            <span className="text-sm font-semibold text-neon-blue uppercase tracking-wide">
              Om TekUp
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-foreground mb-6">
            Incident Response
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-cyan">
              {" "}Økosystem
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            TekUp er et multi-tenant incident response økosystem – ikke et generisk lead værktøj. 
            Vi forbinder backend, web, desktop og mobile tjenester for sikre, compliant og målbare arbejdsgange.
          </p>
        </div>

        {/* Ecosystem overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="glass-card p-6 border-glass-border/30">
            <div className="flex items-center gap-3 mb-3">
              <Server className="w-5 h-5 text-neon-blue" />
              <h3 className="font-orbitron font-bold text-foreground">Flow API</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-3">
              NestJS backend med PostgreSQL + Prisma og Row-Level Security. API-nøgler isolerer tenants.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">Multi-tenant</Badge>
              <Badge variant="outline" className="text-xs bg-glass-border/10 border-glass-border/30">Audit + Metrics</Badge>
            </div>
          </Card>

          <Card className="glass-card p-6 border-glass-border/30">
            <div className="flex items-center gap-3 mb-3">
              <MonitorCog className="w-5 h-5 text-neon-blue" />
              <h3 className="font-orbitron font-bold text-foreground">Flow Web</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-3">
              Next.js dashboard med tenant-routing og real-time opdateringer.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">/t/[tenant]/leads</Badge>
              <Badge variant="outline" className="text-xs bg-glass-border/10 border-glass-border/30">Status & SLA</Badge>
            </div>
          </Card>

          <Card className="glass-card p-6 border-glass-border/30">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-neon-blue" />
              <h3 className="font-orbitron font-bold text-foreground">Secure Platform</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-3">
              Sikkerhed og compliance (NIS2, GDPR) med zero-trust arkitektur.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">Compliance</Badge>
              <Badge variant="outline" className="text-xs bg-glass-border/10 border-glass-border/30">Audit Trails</Badge>
            </div>
          </Card>

          <Card className="glass-card p-6 border-glass-border/30">
            <div className="flex items-center gap-3 mb-3">
              <Smartphone className="w-5 h-5 text-neon-blue" />
              <h3 className="font-orbitron font-bold text-foreground">Inbox AI & Mobile</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-3">
              Desktop e-mail/compliance ingestion + React Native app til respons on-the-go.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">Ingestion</Badge>
              <Badge variant="outline" className="text-xs bg-glass-border/10 border-glass-border/30">Real-time</Badge>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            className="px-8 py-4 bg-neon-blue text-ecosystem-dark font-semibold text-lg rounded-lg hover:bg-neon-blue/90 transition-colors ripple neon-glow"
            onClick={() => {
              const el = document.getElementById('contact');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            Kontakt os
          </button>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
