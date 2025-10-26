'use client';

import { motion } from 'motion/react';
import { Zap, Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullscreen?: boolean;
  variant?: 'default' | 'tekup' | 'minimal';
}

export function LoadingSpinner({ 
  size = 'md', 
  message, 
  fullscreen = false,
  variant = 'default'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const containerSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  if (variant === 'minimal') {
    return (
      <div className={fullscreen ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-modal' : 'flex items-center justify-center p-4'}>
        <Loader2 className={`${sizeClasses[size]} animate-spin text-[var(--color-tekup-primary-fallback)]`} />
        {message && (
          <span className="ml-3 text-muted-foreground font-medium">{message}</span>
        )}
      </div>
    );
  }

  if (variant === 'tekup') {
    return (
      <div className={fullscreen ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-modal' : 'flex flex-col items-center justify-center p-8'}>
        <motion.div
          className={`${containerSizeClasses[size]} bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-2xl flex items-center justify-center mb-4`}
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <Zap className={`${sizeClasses[size]} text-white`} />
        </motion.div>
        
        {message && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-foreground font-medium text-center"
          >
            {message}
          </motion.p>
        )}
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex space-x-1 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-[var(--color-tekup-primary-fallback)] rounded-full"
              animate={{
                y: [0, -8, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={fullscreen ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-modal' : 'flex flex-col items-center justify-center p-8'}>
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className={`${containerSizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner spinning arc */}
        <motion.div
          className={`absolute inset-0 ${containerSizeClasses[size]} border-4 border-transparent border-t-[var(--color-tekup-primary-fallback)] rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className={`${sizeClasses[size]} text-[var(--color-tekup-primary-fallback)]`} />
        </div>
      </div>
      
      {message && (
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mt-4 text-center max-w-xs"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

// Page Loading Component
export function PageLoading({ message = "Indlæser..." }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingSpinner 
        size="lg" 
        variant="tekup" 
        message={message}
      />
    </div>
  );
}

// Inline Loading Component
export function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner 
        size="md" 
        variant="minimal" 
        message={message}
      />
    </div>
  );
}

// Button Loading State
export function ButtonLoading({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin`} />
  );
}