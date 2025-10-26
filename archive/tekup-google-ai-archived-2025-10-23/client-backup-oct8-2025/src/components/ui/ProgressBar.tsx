import { cn } from '../../lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  className?: string
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400'
}

export function ProgressBar({ 
  value, 
  max = 100, 
  label, 
  showPercentage = false,
  className,
  color = 'primary'
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div 
        className="w-full h-2 bg-glass rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}