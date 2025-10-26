import { cn } from '../../lib/utils'
import { Loader2, Sparkles } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'dots' | 'pulse' | 'modern'
}

export function LoadingSpinner({ size = 'md', className, variant = 'default' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  if (variant === 'modern') {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className={cn('animate-spin', sizeClasses[size], className)} style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className="flex items-center justify-center space-x-1">
        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-primary)', animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-primary)', animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-primary)', animationDelay: '300ms' }}></div>
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className="flex items-center justify-center">
        <div className={cn('rounded-full animate-pulse', sizeClasses[size], className)} style={{ background: 'var(--color-primary)' }}></div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          'animate-spin rounded-full border-2 shadow-lg',
          sizeClasses[size],
          className
        )}
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--color-primary)' }}
      />
    </div>
  )
}

export function LoadingOverlay({ children, message }: { children?: React.ReactNode; message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(16px)' }}>
      <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-6 max-w-sm mx-4 animate-fade-in-up">
        <div className="relative">
          <LoadingSpinner size="xl" variant="modern" />
          <Sparkles className="w-4 h-4 absolute -top-1 -right-1 animate-pulse" style={{ color: 'var(--color-info)' }} />
        </div>
        {message && (
          <p className="font-medium text-center animate-pulse" style={{ color: 'var(--color-text-primary)' }}>{message}</p>
        )}
        {children}
      </div>
    </div>
  )
}

export function LoadingState({
  message = 'Indlæser...',
  variant = 'default',
  size = 'lg'
}: {
  message?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'modern';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6 animate-fade-in">
      <div className="relative">
        <LoadingSpinner size={size} variant={variant} />
        {variant === 'modern' && (
          <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(0, 212, 255, 0.2)' }}></div>
        )}
      </div>
      <div className="text-center space-y-2">
        <p className="font-medium animate-pulse" style={{ color: 'var(--color-text-primary)' }}>{message}</p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Dette tager kun et øjeblik...</p>
      </div>
    </div>
  )
}

export function SkeletonLoader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-glass/50',
        className
      )}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-xl p-6 space-y-4 animate-fade-in">
      <div className="flex items-center space-x-4">
        <SkeletonLoader className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <SkeletonLoader className="h-4 w-3/4" />
          <SkeletonLoader className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonLoader className="h-3 w-full" />
        <SkeletonLoader className="h-3 w-5/6" />
        <SkeletonLoader className="h-3 w-4/6" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-fade-in">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 glass rounded-lg">
          <SkeletonLoader className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <SkeletonLoader className="h-4 w-1/4" />
            <SkeletonLoader className="h-3 w-1/3" />
          </div>
          <SkeletonLoader className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  )
}