import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Github, 
  Globe,
  Zap,
  Database,
  Cloud,
  Shield,
  ArrowUp
} from "lucide-react";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-ecosystem-dark border-t border-glass-border/30">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-neon-blue/20 rounded-lg">
                <Zap className="w-6 h-6 text-neon-blue" />
              </div>
              <div>
                <div className="text-xl font-orbitron font-bold text-foreground">
                  TekUp.dk
                </div>
                <div className="text-xs text-neon-blue uppercase tracking-widest">
                  Ecosystem Developer
                </div>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Vi skaber sammenhængende digitale økosystemer der transformerer 
              virksomheder gennem intelligent software og infrastruktur.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 bg-neon-blue/20 rounded-lg hover:bg-neon-blue/30 transition-colors">
                <Linkedin className="w-5 h-5 text-neon-blue" />
              </a>
              <a href="#" className="p-2 bg-neon-blue/20 rounded-lg hover:bg-neon-blue/30 transition-colors">
                <Github className="w-5 h-5 text-neon-blue" />
              </a>
              <a href="#" className="p-2 bg-neon-blue/20 rounded-lg hover:bg-neon-blue/30 transition-colors">
                <Globe className="w-5 h-5 text-neon-blue" />
              </a>
            </div>
          </div>

          {/* Ecosystem Products */}
          <div>
            <h3 className="text-lg font-orbitron font-bold text-foreground mb-6">
              Vores Økosystem
            </h3>
            <div className="space-y-4">
              {[
                { name: "Workplace Deployment", icon: Database, status: "Live" },
                { name: "IT-Support & Service", icon: Cloud, status: "Live" },
                { name: "Netværksløsninger", icon: Zap, status: "Live" },
                { name: "A-Z Rådgivning", icon: Shield, status: "Live" }
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <product.icon className="w-4 h-4 text-neon-blue" />
                    <span className="text-muted-foreground group-hover:text-neon-blue transition-colors">
                      {product.name}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    product.status === 'Live' 
                      ? 'bg-green-500/20 text-green-400' 
                      : product.status === 'Beta'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {product.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-orbitron font-bold text-foreground mb-6">
              Services
            </h3>
            <div className="space-y-3">
              {[
                "IT-Support & Monitoring",
                "Workplace Deployment", 
                "Netværksløsninger",
                "Digital Rådgivning",
                "Custom Development",
                "Cloud Migration",
                "System Integration",
                "Security Audit"
              ].map((service, index) => (
                <a 
                  key={index}
                  href="#"
                  className="block text-muted-foreground hover:text-neon-blue transition-colors"
                >
                  {service}
                </a>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-orbitron font-bold text-foreground mb-6">
              Kontakt
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-neon-blue mt-1" />
                <div>
                  <div className="text-foreground font-semibold">Hovedkontor</div>
                  <div className="text-muted-foreground text-sm">
                    Ørestads Boulevard 108<br />
                    2300 København S
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-neon-blue" />
                <div>
                  <div className="text-foreground font-semibold">+45 22 65 02 26</div>
                  <div className="text-muted-foreground text-sm">24/7 Support</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-neon-blue" />
                <div>
                  <div className="text-foreground font-semibold">kundeservice@tekup.dk</div>
                  <div className="text-muted-foreground text-sm">Sales & Support</div>
                </div>
              </div>
            </div>

            {/* Quick Contact */}
            <div className="mt-6 p-4 glass-card border-glass-border/30 rounded-xl">
              <div className="text-sm font-semibold text-foreground mb-2">
                Hurtig Kontakt
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                Få svar inden for 2 timer
              </div>
              <button className="w-full px-4 py-2 bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue rounded-lg transition-colors text-sm font-semibold">
                Send besked
              </button>
            </div>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="mt-16 pt-8 border-t border-glass-border/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "System Status", value: "All Systems Operational", color: "text-green-400" },
              { label: "Uptime", value: "99.9%", color: "text-blue-400" },
              { label: "Response Time", value: "< 50ms", color: "text-yellow-400" },
              { label: "Active Monitoring", value: "24/7", color: "text-purple-400" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-lg font-orbitron font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-glass-border/30 bg-ecosystem-dark/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>© 2024 TekUp ApS. Alle rettigheder forbeholdes.</span>
              <a href="#" className="hover:text-neon-blue transition-colors">Privatlivspolitik</a>
              <a href="#" className="hover:text-neon-blue transition-colors">Servicevilkår</a>
              <a href="#" className="hover:text-neon-blue transition-colors">Cookies</a>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">CVR: 12345678</span>
              <button 
                onClick={scrollToTop}
                className="p-2 bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue rounded-lg transition-colors"
                aria-label="Scroll to top"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animated background elements */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-30" />
    </footer>
  );
};

export default Footer;