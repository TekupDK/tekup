import { Brain, Database, Network, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface TekUp2025LoadingProps {
  onComplete?: () => void;
}

const TekUp2025Loading = ({ onComplete }: TekUp2025LoadingProps) => {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);

  const loadingPhases = [
    { icon: Database, text: "Initialiserer Business Intelligence...", color: "var(--ai-primary)" },
    { icon: Brain, text: "Starter dataanalyse systemer...", color: "var(--ai-secondary)" },
    { icon: Network, text: "Etablerer sikker forbindelse...", color: "var(--ai-accent)" },
    { icon: Zap, text: "AI platform klar til brug...", color: "var(--holo-1)" },
  ];

  useEffect(() => {
    const duration = 4000; // 4 seconds total
    const interval = 50; // Update every 50ms
    const increment = 100 / (duration / interval);

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + increment, 100);
        
        // Update phase based on progress
        const newPhase = Math.floor((newProgress / 100) * loadingPhases.length);
        if (newPhase !== currentPhase && newPhase < loadingPhases.length) {
          setCurrentPhase(newPhase);
          
          // Trigger glitch effect at phase changes
          setGlitchActive(true);
          setTimeout(() => setGlitchActive(false), 200);
        }
        
        if (newProgress >= 100) {
          clearInterval(progressTimer);
          setTimeout(() => onComplete?.(), 500);
        }
        
        return newProgress;
      });
    }, interval);

    return () => clearInterval(progressTimer);
  }, [currentPhase, onComplete]);

  const CurrentIcon = loadingPhases[currentPhase]?.icon || Brain;
  const currentColor = loadingPhases[currentPhase]?.color || "var(--ai-primary)";

  return (
    <div className="loading-fullscreen flex items-center justify-center neural-network overflow-hidden">
      {/* Holographic Background */}
      <div className="absolute inset-0 fluid-gradient opacity-10" />
      
      {/* Particle Field */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute physics-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
            }}
          >
            <div 
              className="w-1 h-1 rounded-full"
              style={{
                backgroundColor: i % 2 === 0 ? 'var(--ai-primary)' : 'var(--holo-1)',
                boxShadow: `0 0 10px currentColor`,
                opacity: 0.3 + Math.random() * 0.4,
              }}
            />
          </div>
        ))}
      </div>

      {/* Main Loading Container */}
      <div className="relative z-10 text-center max-w-md mx-auto px-4 sm:px-6">
        
        {/* Logo with Glitch Effect */}
        <div className={`mb-8 sm:mb-12 transition-all duration-200 tekup-holo-shimmer ${
          glitchActive ? 'filter brightness-150 contrast-200' : ''
        }`}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 select-none">
            <span 
              className="tekup-logo"
              style={{
                textShadow: glitchActive ? '2px 2px 0 var(--ai-accent), -2px -2px 0 var(--holo-1)' : 'none',
              }}
            >
              TekUp.dk
            </span>
          </h1>
          <p className="text-white/60 text-xs sm:text-sm tracking-wider uppercase select-none">
            NEXT-GEN AI SYSTEMS
          </p>
        </div>

        {/* Central Processing Indicator */}
        <div className="relative mb-6 sm:mb-8">
          <div className="neo-elevated p-6 sm:p-8 rounded-full w-24 h-24 sm:w-32 sm:h-32 mx-auto flex items-center justify-center">
            <CurrentIcon 
              className="w-8 h-8 sm:w-12 sm:h-12 transition-all duration-500"
              style={{ 
                color: currentColor,
                filter: `drop-shadow(0 0 20px ${currentColor})`,
                transform: glitchActive ? 'scale(1.2) rotate(5deg)' : 'scale(1) rotate(0deg)',
              }}
            />
          </div>
          
          {/* Orbital Rings */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border opacity-20"
                style={{
                  borderColor: currentColor,
                  borderWidth: '1px',
                  margin: `${-20 - i * 15}px`,
                  animation: `spin ${3 + i}s linear infinite`,
                  animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
                }}
              />
            ))}
          </div>
        </div>

        {/* Phase Information */}
        <div className="mb-6 sm:mb-8 h-12 flex items-center justify-center">
          <div className={`neo-sunken px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 ${
            glitchActive ? 'scale-105' : 'scale-100'
          }`}>
            <p 
              className="text-xs sm:text-sm font-medium transition-colors duration-300 select-none"
              style={{ color: currentColor }}
            >
              {loadingPhases[currentPhase]?.text || "Initializing..."}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative mb-6">
          <div className="neo-sunken h-3 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300 ease-out relative"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${currentColor}, var(--holo-1))`,
                boxShadow: `0 0 20px ${currentColor}`,
              }}
            >
              {/* Animated shine effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  animation: 'shimmer 2s ease-in-out infinite',
                  transform: 'translateX(-100%)',
                }}
              />
            </div>
          </div>
          
          {/* Progress Percentage */}
          <div className="flex justify-between mt-2 text-xs text-white/50">
            <span>Loading AI Systems</span>
            <span className="font-mono">{Math.floor(progress)}%</span>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-2 gap-4 opacity-60">
          {[
            { label: "Systemer", value: Math.floor(progress * 8.47), unit: "/8" },
            { label: "Tilgængelighed", value: Math.floor(progress * 99.7), unit: "%" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-lg font-mono font-bold" style={{ color: currentColor }}>
                {stat.value}{stat.unit}
              </div>
              <div className="text-xs text-white/40">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Completion State */}
        {progress >= 100 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="holo-shimmer neo-elevated p-8 rounded-full">
              <Zap 
                className="w-16 h-16 text-[var(--ai-accent)]"
                style={{ filter: 'drop-shadow(0 0 30px var(--ai-accent))' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Ambient Intelligence Overlay */}
      <div 
        className={`absolute inset-0 transition-all duration-1000 ${
          progress > 75 ? 'ambient-focus' : progress > 50 ? 'ambient-warm' : 'ambient-cool'
        }`}
        style={{ opacity: 0.05 }}
      />
    </div>
  );
};

export default TekUp2025Loading;