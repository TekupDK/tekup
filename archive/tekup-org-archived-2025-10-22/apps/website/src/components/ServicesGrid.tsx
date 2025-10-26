import { 
  Monitor, 
  Headphones, 
  Network, 
  Lightbulb,
  ArrowRight,
  Zap
} from "lucide-react";

import { Card } from "@/components/ui/card";

const services = [
  {
    icon: Monitor,
    title: "Workplace Deployment",
    description: "Komplet setup og udrulning af digitale arbejdspladser med fuld integration til jeres eksisterende systemer.",
    features: [
      "Hardware og software installation",
      "Sikkerhedsopsætning",
      "Brugertraining",
      "24/7 monitoring"
    ],
    highlight: "99.9% uptime garanti"
  },
  {
    icon: Headphones,
    title: "IT-Support",
    description: "Proaktiv IT-support med AI-drevet fejlfinding og predictive maintenance til minimal downtime.",
    features: [
      "Remote troubleshooting",
      "Predictive analytics",
      "Automated solutions",
      "Emergency response"
    ],
    highlight: "< 4 min gennemsnitlig responstid"
  },
  {
    icon: Network,
    title: "Netværksløsninger",
    description: "Enterprise-grade netværksinfrastruktur med SD-WAN, zero-trust sikkerhed og cloud-integration.",
    features: [
      "SD-WAN implementation",
      "Zero-trust arkitektur",
      "Cloud connectivity",
      "Performance optimization"
    ],
    highlight: "Skalerbar til 10,000+ enheder"
  },
  {
    icon: Lightbulb,
    title: "Digital Rådgivning",
    description: "Strategisk rådgivning til digital transformation med focus på ROI og langsigtet vækst.",
    features: [
      "Digital strategi udvikling",
      "ROI analyse",
      "Technology roadmap",
      "Change management"
    ],
    highlight: "Gennemsnitlig 40% ROI stigning"
  }
];

const ServicesGrid = () => {
  return (
    <section className="py-24 px-6 bg-ecosystem-dark">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-neon-blue/10 px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4 text-neon-blue" />
            <span className="text-sm font-semibold text-neon-blue uppercase tracking-wide">
              Core Services
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-foreground mb-6">
            IT-Services der 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-cyan">
              {" "}fungerer
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Fra deployment til vedligeholdelse - vi leverer IT-services der holder jeres 
            forretning kørende 24/7 med minimal kompleksitet.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index}
              className="group glass-card p-8 ecosystem-hover border-glass-border/30 relative overflow-hidden"
            >
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
              
              {/* Data flow animation */}
              <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-data-flow" />
              
              <div className="relative z-10">
                {/* Icon and Title */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-neon-blue/20 rounded-2xl group-hover:bg-neon-blue/30 transition-colors">
                    <service.icon className="w-8 h-8 text-neon-blue" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-orbitron font-bold text-foreground">
                      {service.title}
                    </h3>
                    <div className="text-sm text-neon-blue font-semibold">
                      {service.highlight}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                  {service.description}
                </p>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse-neon" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Learn More Link */}
                <div className="flex items-center gap-2 text-neon-blue group-hover:gap-4 transition-all cursor-pointer">
                  <span className="font-semibold">Læs mere om service</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="glass-card p-8 max-w-4xl mx-auto">
            <h3 className="text-3xl font-orbitron font-bold text-foreground mb-4">
              Klar til at optimere jeres IT?
            </h3>
            <p className="text-muted-foreground mb-6 text-lg">
              Book en gratis konsultation og få en personlig gennemgang af hvordan 
              TekUp kan transformere jeres IT-landskab.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-neon-blue text-ecosystem-dark font-semibold rounded-lg hover:bg-neon-blue/90 transition-colors ripple neon-glow">
                Book gratis konsultation
              </button>
              <button className="px-6 py-3 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10 font-semibold rounded-lg glass transition-colors">
                Download servicebrochure
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesGrid;