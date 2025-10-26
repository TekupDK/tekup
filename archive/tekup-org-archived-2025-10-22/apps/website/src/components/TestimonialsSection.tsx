import { 
  Star, 
  Building, 
  TrendingUp, 
  Clock,
  Users,
  Zap
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const testimonials = [
  {
    id: "LOG_001",
    company: "Nordic Manufacturing A/S",
    industry: "Manufacturing",
    user: "Lars Nielsen, CTO",
    timestamp: "2024.01.15 14:32",
    rating: 5,
    metrics: {
      efficiency: "+45%",
      cost_reduction: "32%",
      uptime: "99.8%"
    },
    message: "TekUp's BusinessOS har revolutioneret vores produktionsprocesser. Integration med vores legacy ERP-system var sømløs, og ROI blev opnået inden for 6 måneder.",
    tags: ["ERP Integration", "Process Automation", "Legacy Migration"]
  },
  {
    id: "LOG_002", 
    company: "Copenhagen Tech Hub",
    industry: "Technology Services",
    user: "Maria Andersen, CEO",
    timestamp: "2024.02.03 09:15",
    rating: 5,
    metrics: {
      deployment_time: "-70%",
      incidents: "-85%",
      satisfaction: "97%"
    },
    message: "JARVIS AI har automatiseret 80% af vores support tickets. Vores kunder får hjælp 24/7, og vores team kan fokusere på strategisk udvikling i stedet for rutineopgaver.",
    tags: ["AI Automation", "Customer Support", "24/7 Operations"]
  },
  {
    id: "LOG_003",
    company: "Green Energy Solutions",
    industry: "Renewable Energy", 
    user: "Thomas Sørensen, IT Director",
    timestamp: "2024.01.28 16:45",
    rating: 5,
    metrics: {
      monitoring: "Real-time",
      alerts: "Proactive",
      response: "<2min"
    },
    message: "RenOS har givet os komplet kontrol over vores faciliteter. Predictive maintenance har reduceret uplanlagt nedetid med 90%, og energioptimering sparer os 200.000 kr årligt.",
    tags: ["IoT Integration", "Predictive Analytics", "Energy Optimization"]
  },
  {
    id: "LOG_004",
    company: "Danske Bank Business",
    industry: "Financial Services",
    user: "Anne Kristensen, Head of IT",
    timestamp: "2024.02.10 11:20",
    rating: 5,
    metrics: {
      security: "Zero-trust",
      compliance: "100%", 
      audits: "Automated"
    },
    message: "SecureVault opfylder alle vores compliance krav og mere til. Zero-trust arkitekturen giver os tryghed, mens automated auditing sparer timevis af manuel arbejde.",
    tags: ["Financial Compliance", "Zero-Trust", "Automated Auditing"]
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 px-6 bg-ecosystem">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-neon-blue/10 px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4 text-neon-blue" />
            <span className="text-sm font-semibold text-neon-blue uppercase tracking-wide">
              Success Logs
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-foreground mb-6">
            Resultat
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-cyan">
              {" "}Dashboard
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-time feedback fra vores kunder - målt, verificeret og dokumenteret 
            i vores success monitoring system.
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { icon: Building, label: "Active Clients", value: "150+", color: "text-green-400" },
            { icon: TrendingUp, label: "Avg. ROI Increase", value: "340%", color: "text-blue-400" },
            { icon: Clock, label: "Avg. Response Time", value: "< 4min", color: "text-yellow-400" },
            { icon: Users, label: "Support Satisfaction", value: "98.5%", color: "text-purple-400" }
          ].map((stat, index) => (
            <div key={index} className="glass-card p-6 text-center">
              <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
              <div className={`text-2xl font-orbitron font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial Cards as Dashboard Logs */}
        <div className="space-y-6">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="glass-card p-6 border-glass-border/30 relative overflow-hidden"
            >
              {/* Status indicator */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-500" />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Log Header */}
                <div className="lg:col-span-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs font-mono bg-green-500/20 text-green-400 border-green-500/30">
                      {testimonial.id}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-glass-border/10 border-glass-border/30">
                      {testimonial.industry}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-orbitron font-bold text-foreground mb-1">
                    {testimonial.company}
                  </h3>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    {testimonial.user}
                  </div>
                  
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <div className="text-xs text-muted-foreground font-mono">
                    {testimonial.timestamp}
                  </div>
                </div>

                {/* Log Content */}
                <div className="lg:col-span-2">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
                      Metrics
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(testimonial.metrics).map(([key, value], idx) => (
                        <div key={idx} className="text-center">
                          <div className="text-lg font-orbitron font-bold text-neon-blue">
                            {value}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {key.replace('_', ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <blockquote className="text-foreground italic mb-4 leading-relaxed">
                    "{testimonial.message}"
                  </blockquote>
                  
                  <div className="flex flex-wrap gap-2">
                    {testimonial.tags.map((tag, idx) => (
                      <Badge 
                        key={idx}
                        variant="outline"
                        className="text-xs bg-neon-blue/10 text-neon-blue border-neon-blue/30"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="glass-card p-8 max-w-4xl mx-auto">
            <h3 className="text-3xl font-orbitron font-bold text-foreground mb-4">
              Vil du være vores næste success story?
            </h3>
            <p className="text-muted-foreground mb-6 text-lg">
              Join vores growing ecosystem af virksomheder der har transformeret 
              deres IT-landskab med TekUp's løsninger.
            </p>
            <button className="px-8 py-4 bg-neon-blue text-ecosystem-dark font-semibold text-lg rounded-lg hover:bg-neon-blue/90 transition-colors ripple neon-glow">
              Start din transformation
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;