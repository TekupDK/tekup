import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ 
  title = 'Noget gik galt', 
  description = 'Der opstod en fejl ved indlæsning af data',
  onRetry,
  className 
}: ErrorStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 text-center",
      className
    )}>
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 sm:mb-6">
        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Prøv igen
        </button>
      )}
    </div>
  )
}