import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

import { Progress } from "@/components/ui/progress";

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const steps = [
    "Initialiserer TekUp systemer...",
    "Forbereder IT-Support services...",
    "Konfigurerer netværksløsninger...",
    "Aktiverer Workplace Deployment...",
    "Etablerer sikre forbindelser...",
    "Velkommen til TekUp!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 5;
        const stepIndex = Math.floor((newProgress / 100) * steps.length);
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex]);
        }
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete, steps]);

  return (
    <div className="fixed inset-0 bg-ecosystem z-50 flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-neon-blue rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: 0.6
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-4 bg-neon-blue/20 rounded-2xl animate-pulse-neon">
              <Zap className="w-8 h-8 text-neon-blue" />
            </div>
          </div>
          <h1 className="text-4xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-cyan mb-2">
            TekUp.dk
          </h1>
          <p className="text-neon-blue/80 text-sm uppercase tracking-widest">
            Ecosystem Developer
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="text-foreground font-mono text-sm h-6">
            {currentStep}
          </div>
        </div>

        {/* Loading animation */}
        <div className="flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-neon-blue rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;