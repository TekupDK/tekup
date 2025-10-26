'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component?: React.ComponentType<any>;
  completed: boolean;
  required: boolean;
  estimatedTime?: string;
}

interface OnboardingContextType {
  steps: OnboardingStep[];
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  isActive: boolean;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  completeStep: (stepId: string) => void;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  progress: number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Define onboarding steps for Danish cleaning business
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Velkommen til Tekup!',
      description: 'Lad os hjælpe dig med at komme i gang med at automatisere din rengøringsvirksomhed.',
      completed: false,
      required: true,
      estimatedTime: '1 min'
    },
    {
      id: 'business-info',
      title: 'Virksomhedsoplysninger',
      description: 'Fortæl os om din rengøringsvirksomhed for at tilpasse oplevelsen.',
      completed: false,
      required: true,
      estimatedTime: '3 min'
    },
    {
      id: 'team-setup',
      title: 'Team opsætning',
      description: 'Inviter teammedlemmer og definer roller i jeres organisation.',
      completed: false,
      required: false,
      estimatedTime: '5 min'
    },
    {
      id: 'lead-sources',
      title: 'Lead kilder',
      description: 'Tilslut dine lead kilder som Leadpoint.dk, Leadmail.no og andre.',
      completed: false,
      required: true,
      estimatedTime: '5 min'
    },
    {
      id: 'ai-configuration',
      title: 'AI konfiguration',
      description: 'Konfigurer Jarvis AI til at matche dine forretningsprocesser.',
      completed: false,
      required: false,
      estimatedTime: '7 min'
    },
    {
      id: 'first-lead',
      title: 'Dit første lead',
      description: 'Tilføj dit første lead og se hvordan systemet fungerer.',
      completed: false,
      required: true,
      estimatedTime: '3 min'
    },
    {
      id: 'dashboard-tour',
      title: 'Dashboard rundtur',
      description: 'Lær at navigere i dit nye Tekup dashboard og alle funktioner.',
      completed: false,
      required: false,
      estimatedTime: '5 min'
    }
  ]);

  // Check if user should see onboarding
  useEffect(() => {
    if (isAuthenticated && user) {
      const hasCompletedOnboarding = localStorage.getItem(`tekup_onboarding_completed_${user.id}`);
      const isNewUser = !user.tenant || user.tenant.name === 'Tekup Demo Rengøring'; // Demo users get onboarding
      
      if (!hasCompletedOnboarding && isNewUser) {
        setIsActive(true);
      }
    }
  }, [isAuthenticated, user]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipStep = () => {
    if (!steps[currentStep].required) {
      completeStep(steps[currentStep].id);
      nextStep();
    }
  };

  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
    
    // Save progress to localStorage
    if (user) {
      const progress = {
        completedSteps: steps.filter(s => s.completed).map(s => s.id),
        currentStep,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`tekup_onboarding_progress_${user.id}`, JSON.stringify(progress));
    }
  };

  const startOnboarding = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`tekup_onboarding_completed_${user.id}`, 'true');
      localStorage.removeItem(`tekup_onboarding_progress_${user.id}`);
    }
    setIsActive(false);
  };

  const resetOnboarding = () => {
    if (user) {
      localStorage.removeItem(`tekup_onboarding_completed_${user.id}`);
      localStorage.removeItem(`tekup_onboarding_progress_${user.id}`);
    }
    setSteps(prev => prev.map(step => ({ ...step, completed: false })));
    setCurrentStep(0);
    setIsActive(true);
  };

  // Calculate progress
  const completedSteps = steps.filter(step => step.completed).length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  const isCompleted = completedSteps === steps.length;

  // Load saved progress on mount
  useEffect(() => {
    if (user) {
      const savedProgress = localStorage.getItem(`tekup_onboarding_progress_${user.id}`);
      if (savedProgress) {
        try {
          const { completedSteps: completed, currentStep: savedStep } = JSON.parse(savedProgress);
          setSteps(prev => prev.map(step => ({
            ...step,
            completed: completed.includes(step.id)
          })));
          setCurrentStep(savedStep);
        } catch (error) {
          console.error('Error loading onboarding progress:', error);
        }
      }
    }
  }, [user]);

  const value: OnboardingContextType = {
    steps,
    currentStep,
    totalSteps: steps.length,
    isCompleted,
    isActive,
    nextStep,
    prevStep,
    skipStep,
    completeStep,
    startOnboarding,
    completeOnboarding,
    resetOnboarding,
    progress
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}