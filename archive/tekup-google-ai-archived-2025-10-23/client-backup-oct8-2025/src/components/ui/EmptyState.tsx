import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 text-center",
      className
    )}>
      {icon && (
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-glass border border-glass flex items-center justify-center mb-4 sm:mb-6">
          <div className="text-muted-foreground">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}