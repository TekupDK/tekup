'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader } from '../ui/dialog';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { useOnboarding } from './OnboardingProvider';
import { 
  ChevronLeft, 
  ChevronRight, 
  Skip, 
  Clock, 
  CheckCircle,
  Building2,
  Users,
  Mail,
  Brain,
  UserPlus,
  BarChart3,
  Sparkles
} from 'lucide-react';

// Import step components
import { WelcomeStep } from './steps/WelcomeStep';
import { BusinessInfoStep } from './steps/BusinessInfoStep';
import { TeamSetupStep } from './steps/TeamSetupStep';
import { LeadSourcesStep } from './steps/LeadSourcesStep';
import { AIConfigurationStep } from './steps/AIConfigurationStep';
import { FirstLeadStep } from './steps/FirstLeadStep';
import { DashboardTourStep } from './steps/DashboardTourStep';

const stepIcons = {
  welcome: Sparkles,
  'business-info': Building2,
  'team-setup': Users,
  'lead-sources': Mail,
  'ai-configuration': Brain,
  'first-lead': UserPlus,
  'dashboard-tour': BarChart3
};

const stepComponents = {
  welcome: WelcomeStep,
  'business-info': BusinessInfoStep,
  'team-setup': TeamSetupStep,
  'lead-sources': LeadSourcesStep,
  'ai-configuration': AIConfigurationStep,
  'first-lead': FirstLeadStep,
  'dashboard-tour': DashboardTourStep
};

export function OnboardingModal() {
  const {
    steps,
    currentStep,
    totalSteps,
    isActive,
    nextStep,
    prevStep,
    skipStep,
    completeStep,
    completeOnboarding,
    progress
  } = useOnboarding();

  const [stepData, setStepData] = useState<Record<string, any>>({});

  if (!isActive || currentStep >= totalSteps) {
    return null;
  }

  const current = steps[currentStep];
  const StepIcon = stepIcons[current.id as keyof typeof stepIcons];
  const StepComponent = stepComponents[current.id as keyof typeof stepComponents];

  const handleNext = () => {
    completeStep(current.id);
    if (currentStep === totalSteps - 1) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  const handleStepData = (data: any) => {
    setStepData(prev => ({
      ...prev,
      [current.id]: data
    }));
  };

  const canProceed = current.required ? current.completed || stepData[current.id] : true;

  return (
    <Dialog open={isActive} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-xl flex items-center justify-center">
                <StepIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{current.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Trin {currentStep + 1} af {totalSteps}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {current.estimatedTime && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{current.estimatedTime}</span>
                </Badge>
              )}
              
              {current.completed && (
                <Badge className="bg-[var(--color-tekup-success-fallback)] text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Fuldført
                </Badge>
              )}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress}% fuldført</span>
              <span>{steps.filter(s => s.completed).length} af {totalSteps} trin</span>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <p className="text-muted-foreground">{current.description}</p>
            </div>

            {/* Render step component */}
            {StepComponent && (
              <StepComponent
                data={stepData[current.id]}
                onDataChange={handleStepData}
                onComplete={() => completeStep(current.id)}
              />
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 border-t bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Tilbage</span>
            </Button>

            <div className="flex items-center space-x-3">
              {/* Skip button for optional steps */}
              {!current.required && !current.completed && (
                <Button
                  variant="ghost"
                  onClick={skipStep}
                  className="flex items-center space-x-2 text-muted-foreground"
                >
                  <Skip className="w-4 h-4" />
                  <span>Spring over</span>
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] text-white flex items-center space-x-2"
              >
                <span>
                  {currentStep === totalSteps - 1 ? 'Afslut opsætning' : 'Næste'}
                </span>
                {currentStep < totalSteps - 1 && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center mt-4 space-x-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-[var(--color-tekup-primary-fallback)]'
                    : step.completed
                    ? 'bg-[var(--color-tekup-success-fallback)]'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}