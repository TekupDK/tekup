import { useState, useEffect } from "react";
import { 
  Github, 
  Linkedin, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin, 
  Brain, 
  Zap,
  Network,
  Database,
  Shield,
  Rocket,
  Globe,
  Heart,
  Code,
  Users,
  ChevronUp
} from "lucide-react";

interface FooterLinkProps {
  icon?: any;
  text: string;
  href: string;
  delay?: number;
  isExternal?: boolean;
}

const FooterLink = ({ icon: Icon, text, href, delay = 0, isExternal = false }: FooterLinkProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : "_self"}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group flex items-center space-x-3 p-2 rounded-lg transition-all duration-500 hover:neo-sunken particle-trail"
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {Icon && (
        <div
          className="p-2 rounded-md transition-all duration-300"
          style={{
            backgroundColor: isHovered ? 'var(--ai-accent)20' : 'transparent',
            boxShadow: isHovered ? '0 0 20px var(--ai-accent)30' : 'none',
          }}
        >
          <Icon 
            className="w-4 h-4 transition-colors duration-300"
            style={{ 
              color: isHovered ? 'var(--ai-accent)' : 'rgba(255, 255, 255, 0.6)',
            }}
          />
        </div>
      )}
      <span className="text-white/60 group-hover:text-white transition-colors duration-300">
        {text}
      </span>
    </a>
  );
};

interface SocialIconProps {
  icon: any;
  href: string;
  label: string;
  color: string;
  delay?: number;
}

const SocialIcon = ({ icon: Icon, href, label, color, delay = 0 }: SocialIconProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group relative p-3 rounded-full neo-elevated hover:quantum-glow transition-all duration-500"
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Icon 
        className="w-5 h-5 transition-all duration-300"
        style={{ 
          color: isHovered ? color : 'rgba(255, 255, 255, 0.7)',
          filter: isHovered ? `drop-shadow(0 0 10px ${color})` : 'none',
        }}
      />
      
      {/* Holographic ring on hover */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-full border-2 animate-pulse"
          style={{
            borderColor: color,
            boxShadow: `0 0 20px ${color}`,
          }}
        />
      )}
    </a>
  );
};

const TekUp2025Footer = () => {
  const [currentYear] = useState(new Date().getFullYear());
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [aiSystemStatus] = useState({
    online: true,
    uptime: "99.97%",
    responseTime: "12ms"
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const companyLinks = [
    { text: "Om TekUp", href: "/about" },
    { text: "Vores Vision", href: "/vision" },
    { text: "AI Teknologi", href: "/technology" },
    { text: "Karriere", href: "/careers", icon: Users },
  ];

  const productLinks = [
    { text: "AI Dashboard", href: "/dashboard", icon: Brain },
    { text: "Neural Networks", href: "/neural", icon: Network },
    { text: "Quantum Computing", href: "/quantum", icon: Zap },
    { text: "Data Analytics", href: "/analytics", icon: Database },
  ];

  const supportLinks = [
    { text: "Documentation", href: "/docs", icon: Code },
    { text: "API Reference", href: "/api" },
    { text: "Status Page", href: "/status", icon: Shield },
    { text: "Contact Support", href: "/support" },
  ];

  const socialLinks = [
    { icon: Github, href: "https://github.com/tekup-org", label: "GitHub", color: "var(--ai-primary)" },
    { icon: Linkedin, href: "https://linkedin.com/company/tekup", label: "LinkedIn", color: "var(--ai-secondary)" },
    { icon: Twitter, href: "https://twitter.com/tekup_dk", label: "Twitter", color: "var(--ai-accent)" },
    { icon: Mail, href: "mailto:hello@tekup.dk", label: "Email", color: "var(--holo-1)" },
  ];

  return (
    <footer className="relative bg-[var(--surface-base)] border-t border-white/10 neural-network">
      {/* Holographic Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--ai-accent)] to-transparent opacity-70" />
      
      {/* Ambient Background */}
      <div className="absolute inset-0 ambient-cool opacity-5" />
      
      <div className="relative z-10 container mx-auto px-6 py-16">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Company Info */}
          <div className="space-y-6 physics-float">
            <div className="flex items-center space-x-3">
              <div className="holo-shimmer p-3 rounded-lg">
                <Zap className="w-8 h-8 text-[var(--ai-accent)]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-mono">TekUp.dk</h3>
                <p className="text-xs text-white/50">Neural Interface 2025</p>
              </div>
            </div>
            
            <p className="text-white/70 leading-relaxed">
              Pionerer inden for AI-drevet teknologi. Vi skaber intelligente løsninger 
              der transformerer virksomheder og forbedrer menneskers liv.
            </p>
            
            {/* AI System Status */}
            <div className="neo-sunken p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm">AI System Status</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    aiSystemStatus.online ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-xs text-white/60 font-mono">
                    {aiSystemStatus.online ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-white/50">Uptime</div>
                  <div className="text-[var(--ai-accent)] font-mono">{aiSystemStatus.uptime}</div>
                </div>
                <div>
                  <div className="text-white/50">Response</div>
                  <div className="text-[var(--holo-1)] font-mono">{aiSystemStatus.responseTime}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
              <Rocket className="w-5 h-5 text-[var(--ai-accent)]" />
              <span>Virksomhed</span>
            </h4>
            <div className="space-y-3">
              {companyLinks.map((link, index) => (
                <FooterLink key={link.href} {...link} delay={index * 100} />
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
              <Brain className="w-5 h-5 text-[var(--ai-secondary)]" />
              <span>Produkter</span>
            </h4>
            <div className="space-y-3">
              {productLinks.map((link, index) => (
                <FooterLink key={link.href} {...link} delay={(index + 4) * 100} />
              ))}
            </div>
          </div>

          {/* Support Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[var(--holo-1)]" />
              <span>Support</span>
            </h4>
            <div className="space-y-3">
              {supportLinks.map((link, index) => (
                <FooterLink key={link.href} {...link} delay={(index + 8) * 100} />
              ))}
            </div>

            {/* Contact Info */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center space-x-3 text-sm text-white/60">
                <MapPin className="w-4 h-4" />
                <span>København, Danmark</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-white/60">
                <Phone className="w-4 h-4" />
                <span>+45 12 34 56 78</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-white/60">
                <Globe className="w-4 h-4" />
                <span>Available 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media & Bottom Section */}
        <div className="border-t border-white/10 pt-12">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0">
            
            {/* Social Icons */}
            <div className="flex items-center space-x-4">
              <span className="text-white/60 text-sm mr-4">Følg os:</span>
              {socialLinks.map((social, index) => (
                <SocialIcon 
                  key={social.href} 
                  {...social} 
                  delay={index * 150} 
                />
              ))}
            </div>

            {/* Copyright & Legal */}
            <div className="text-center lg:text-right space-y-2">
              <p className="text-white/60 text-sm flex items-center justify-center lg:justify-end space-x-2">
                <span>© {currentYear} TekUp.dk</span>
                <Heart className="w-4 h-4 text-red-400" />
                <span>Made with AI</span>
              </p>
              <div className="flex items-center justify-center lg:justify-end space-x-6 text-xs text-white/50">
                <a href="/privacy" className="hover:text-[var(--ai-accent)] transition-colors">
                  Privatlivspolitik
                </a>
                <a href="/terms" className="hover:text-[var(--ai-accent)] transition-colors">
                  Vilkår & Betingelser
                </a>
                <a href="/cookies" className="hover:text-[var(--ai-accent)] transition-colors">
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 neo-elevated rounded-full quantum-glow hover:hover-lift transition-all duration-500 z-50 group"
          aria-label="Back to top"
        >
          <ChevronUp className="w-5 h-5 text-[var(--ai-accent)] group-hover:text-white" />
        </button>
      )}

      {/* Matrix Rain Effect */}
      <div className="absolute bottom-0 left-0 w-full h-32 matrix-rain opacity-20 pointer-events-none" />
    </footer>
  );
};

export default TekUp2025Footer;