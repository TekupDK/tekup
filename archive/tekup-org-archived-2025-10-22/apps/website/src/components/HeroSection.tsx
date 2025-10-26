import { useState, useEffect } from "react";
import { ChevronRight, Globe, Zap, Database, Cpu, Play, ArrowDown } from "lucide-react";

import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ecosystem pt-20">
      {/* Interactive cursor follower */}
      <div 
        className="fixed w-32 h-32 pointer-events-none z-10 opacity-20"
        style={{
          left: mousePosition.x - 64,
          top: mousePosition.y - 64,
          background: 'radial-gradient(circle, hsl(195 100% 50% / 0.3), transparent 70%)',
          transition: 'all 0.1s ease-out'
        }}
      />
      
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Enhanced multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-ecosystem-dark/95 via-background/30 to-neon-blue/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-ecosystem-dark/80 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-radial from-neon-blue/5 via-transparent to-ecosystem-dark/50" />
        
        {/* Matrix rain effect */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(15)].map((_, i) => (
            <div
              key={`matrix-${i}`}
              className="absolute w-0.5 h-32 bg-gradient-to-b from-neon-blue/60 via-neon-cyan/40 to-transparent animate-matrix"
              style={{
                left: `${(i * 7) % 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${8 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
        
        {/* Enhanced floating data points with connections */}
        <div className="absolute inset-0">
          {[...Array(25)].map((_, i) => {
            const size = 2 + Math.random() * 4;
            const isSpecial = i % 5 === 0;
            return (
              <div key={`point-${i}`}>
                <div
                  className={`absolute rounded-full animate-float ${isSpecial ? 'bg-neon-cyan shadow-neon-lg animate-glow-pulse' : 'bg-neon-blue shadow-neon'}`}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${3 + Math.random() * 2}s`,
                    opacity: 0.3 + Math.random() * 0.5,
                    ...(isSpecial && {
                      filter: 'brightness(1.5)',
                      transform: `scale(${1.2 + Math.random() * 0.8})`
                    })
                  }}
                />
                {/* Enhanced connecting lines */}
                {i % 3 === 0 && (
                  <div
                    className="absolute h-px bg-gradient-to-r from-transparent via-neon-blue/40 to-transparent animate-data-flow"
                    style={{
                      left: `${Math.random() * 80}%`,
                      top: `${Math.random() * 80}%`,
                      width: `${150 + Math.random() * 300}px`,
                      animationDelay: `${Math.random() * 4}s`,
                      transform: `rotate(${Math.random() * 360}deg)`
                    }}
                  />
                )}
                {/* Vertical data streams */}
                {i % 7 === 0 && (
                  <div
                    className="absolute w-px h-20 bg-gradient-to-b from-transparent via-neon-cyan/30 to-transparent animate-shimmer"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 80}%`,
                      animationDelay: `${Math.random() * 3}s`
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
        
        {/* Connecting lines */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="hsl(195 100% 50%)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            {[...Array(8)].map((_, i) => (
              <line
                key={i}
                x1={`${Math.random() * 100}%`}
                y1={`${Math.random() * 100}%`}
                x2={`${Math.random() * 100}%`}
                y2={`${Math.random() * 100}%`}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                className="animate-glow-pulse"
                style={{ animationDelay: `${i * 0.5}s` }}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Hero Content */}
      <div className={`relative z-10 text-center max-w-6xl mx-auto px-6 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        {/* Logo/Brand with enhanced animation */}
        <div className="mb-8">
          <div className="relative inline-block">
            <h1 className="text-6xl md:text-8xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-x animate-gradient-x mb-4 neon-text">
              TekUp.dk
            </h1>
            {/* Enhanced glowing underline with pulse */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent animate-glow-pulse shadow-neon-lg" />
            {/* Side accent lines */}
            <div className="absolute top-1/2 -left-12 w-8 h-px bg-gradient-to-r from-neon-cyan to-transparent animate-shimmer" />
            <div className="absolute top-1/2 -right-12 w-8 h-px bg-gradient-to-l from-neon-cyan to-transparent animate-shimmer" style={{ animationDelay: '1s' }} />
          </div>
          <div className="flex items-center justify-center gap-3 text-neon-blue/80 mt-6">
            <Database className="w-6 h-6 animate-pulse" />
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-neon-blue to-transparent" />
            <span className="text-sm font-inter uppercase tracking-widest font-semibold">Ecosystem Developer</span>
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-neon-blue to-transparent" />
            <Cpu className="w-6 h-6 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* Main Headline */}
        <h2 className="text-4xl md:text-6xl font-orbitron font-bold text-foreground mb-6 leading-tight">
          Din partner i{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-cyan">
            digital transformation
          </span>
        </h2>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto font-inter leading-relaxed">
          Professionel IT-partner med fokus på din virksomheds digitale transformation.
          Fra Workplace Deployment til avancerede netværksløsninger - vi håndterer alt.
        </p>

        {/* Enhanced CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Button 
            size="lg"
            className="group relative px-10 py-5 bg-neon-blue hover:bg-neon-blue/90 text-ecosystem-dark font-semibold text-xl ripple overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-neon-lg"
          >
            <div className="relative z-10 flex items-center">
              <Zap className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
              Udforsk vores økosystem
              <ChevronRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
            </div>
            {/* Enhanced animated background */}
            <div className="absolute inset-0 bg-gradient-x opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-x" />
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
          </Button>
          
          <Button 
            variant="outline"
            size="lg"
            className="group px-10 py-5 border-2 border-neon-blue/50 text-neon-blue hover:text-neon-cyan font-semibold text-xl glass-card relative overflow-hidden backdrop-blur-glass hover:border-neon-cyan/70 transition-all duration-500 hover:scale-105"
          >
            <div className="relative z-10 flex items-center">
              <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
              Se demo video
            </div>
            {/* Enhanced hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {/* Border glow */}
            <div className="absolute inset-0 rounded-lg border border-neon-blue/30 opacity-0 group-hover:opacity-100 animate-glow-pulse transition-opacity duration-300" />
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Aktive Projekter", value: "12+" },
            { label: "Integrationer", value: "50+" },
            { label: "Kunder", value: "100+" },
            { label: "Uptime", value: "99.9%" }
          ].map((stat, index) => (
            <div key={index} className="glass-card p-6 text-center ecosystem-hover">
              <div className="text-3xl font-orbitron font-bold text-neon-blue mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <span className="text-neon-blue/60 text-sm mb-3 font-inter">Scroll for mere</span>
          <div className="p-3 glass-card border-glass-border/30 rounded-full animate-bounce">
            <ArrowDown className="w-5 h-5 text-neon-blue" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;