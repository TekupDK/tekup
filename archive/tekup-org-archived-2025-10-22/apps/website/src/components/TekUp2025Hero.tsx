import { ArrowRight, Bot, Brain, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import AIInsightDashboard from "./AIInsightDashboard";

import { Button } from "@/components/ui/button";

const TekUp2025Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    // AI thinking simulation
    const thinkingInterval = setInterval(() => {
      setAiThinking(prev => !prev);
    }, 3000);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(thinkingInterval);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden neural-network">
      {/* AI Ambient Background */}
      <div className="absolute inset-0 fluid-gradient opacity-5" />

      {/* Spatial Computing Layers */}
      <div className="spatial-layer absolute inset-0">
        {/* Floating AI Particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute physics-float motion-safe:animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  i % 3 === 0 ? 'bg-[var(--ai-primary)]' :
                  i % 3 === 1 ? 'bg-[var(--ai-secondary)]' :
                  'bg-[var(--ai-accent)]'
                }`}
                style={{
                  boxShadow: `0 0 20px currentColor`,
                  opacity: 0.6 + Math.random() * 0.4,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Holographic Cursor Follower */}
      <div
        className="fixed w-64 h-64 pointer-events-none z-10 opacity-20"
        style={{
          left: mousePosition.x - 128,
          top: mousePosition.y - 128,
          background: `radial-gradient(circle, var(--holo-1), var(--holo-2), transparent)`,
          filter: 'blur(40px)',
          transition: 'all 0.1s ease-out'
        }}
      />

      {/* Main Content */}
      <div className={`relative z-20 text-center max-w-6xl mx-auto px-6 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>

        {/* AI Status Indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="neo-elevated px-6 py-3 holo-shimmer">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                aiThinking ? 'bg-[var(--ai-primary)]' : 'bg-[var(--holo-1)]'
              }`}
              style={{
                boxShadow: `0 0 15px currentColor`,
                animation: aiThinking ? 'neuralPulse 1s ease-in-out infinite' : 'none'
              }}/>
              <span className="text-sm font-medium text-white">
                {aiThinking ? 'AI Analyserer...' : 'System Klar'}
              </span>
              <Brain className="w-4 h-4 text-[var(--ai-accent)]" />
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <div className="mb-16">
          <h1 className="text-7xl md:text-9xl font-black mb-8 leading-tight">
            <span className="block fluid-gradient bg-clip-text text-transparent font-mono tracking-tight">
              TekUp.dk
            </span>
            <span className="block text-4xl md:text-6xl text-white font-light mt-6">
              AI-drevne IT-løsninger
            </span>
          </h1>

          {/* AI Tagline */}
          <div className="relative mb-12">
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              <span className="holo-shimmer px-2 py-1 rounded">Intelligent dataanalyse</span> møder
              <span className="text-[var(--ai-accent)]"> enterprise IT</span>.
              Vi transformerer din digitale infrastruktur med
              <span className="text-[var(--ai-primary)]"> kunstig intelligens</span> og
              <span className="text-[var(--holo-1)]"> markedsledende</span> teknologier.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-20">
          {/* Primary AI CTA */}
          <Button
            size="lg"
            className="group relative px-12 py-6 neo-elevated overflow-hidden text-xl font-semibold bg-gradient-to-r from-[var(--ai-primary)] to-[var(--ai-secondary)] text-white border-0 focus:outline-none focus:ring-2 focus:ring-[var(--ai-primary)] focus:ring-offset-2 focus:ring-offset-[var(--surface-base)]"
            style={{
              background: 'linear-gradient(135deg, var(--ai-primary), var(--ai-secondary))',
              boxShadow: '0 0 15px var(--ai-primary)40',
            }}
          >
            <div className="relative z-10 flex items-center">
              <Bot className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
              Start AI-transformation
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--ai-accent)] to-[var(--holo-1)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Button>

          {/* Secondary Exploration CTA */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setDashboardOpen(true)}
            className="group px-12 py-6 neo-sunken text-xl font-semibold text-white border-2 border-[var(--ai-primary)]/50 hover:border-[var(--ai-primary)] relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--ai-primary)] focus:ring-offset-2 focus:ring-offset-[var(--surface-base)]"
          >
            <div className="relative z-10 flex items-center">
              <Sparkles className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
              Udforsk AI dashboard
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--ai-primary)]/10 to-[var(--holo-1)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
        </div>

        {/* AI Metrics Dashboard */}
        <div className="metrics-container spatial-3d mb-20">
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
            { label: "Aktive modeller", value: "847", unit: "Kørende", color: "var(--ai-primary)" },
            { label: "Datastrømme", value: "847.000", unit: "Aktive", color: "var(--ai-secondary)" },
            { label: "AI-nøjagtighed", value: "99,97", unit: "%", color: "var(--ai-accent)" },
            { label: "Sikkerhedsniveau", value: "★★★★★", unit: "(Enterprise)", color: "var(--holo-1)" }
          ].map((metric, index) => (
            <div
              key={index}
              className={`spatial-card neo-elevated glass-ultra p-8 text-center holo-shimmer smooth-micro min-h-[140px] ${
                metric.label === 'Sikkerhedsniveau' ? 'consciousness-pulse quantum-entangled' : 'quantum-holo'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className="text-3xl font-mono font-bold mb-2"
                style={{ color: metric.color, textShadow: `0 0 10px ${metric.color}` }}
              >
                {metric.value}
              </div>
              <div className="text-xs text-white/70 uppercase tracking-wide mb-1">
                {metric.unit}
              </div>
              <div className="text-sm text-white/90 font-medium">
                {metric.label}
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* PWA Features Section - Hidden for cleaner look */}
        {/* <div className="mt-16 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PWAStatus />
            <PushNotificationManager />
          </div>
        </div> */}

        {/* AI Progress Indicator */}
        <div className="mt-12 flex flex-col items-center space-y-4">
          <p className="text-sm text-white/80 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--ai-accent)]" />
            Næste generations AI-klar • Quantum-computing aktiveret • PWA-installerbar • Push-notifikationer
          </p>
          <div className="w-px h-8 bg-gradient-to-b from-[var(--ai-primary)] to-transparent animate-pulse" />
        </div>
      </div>

      {/* Ambient Responsive Background */}
      <div
        className={`absolute inset-0 transition-all duration-2000 ${
          aiThinking ? 'ambient-warm' : 'ambient-cool'
        }`}
        style={{ opacity: 0.05 }}
      />

      {/* AI Insight Dashboard Modal */}
      <AIInsightDashboard
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
      />
    </section>
  );
};

export default TekUp2025Hero;