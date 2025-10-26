import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  rows?: number
}

export function LoadingSkeleton({ className, rows = 1 }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md mb-2 last:mb-0 animate-gradient-shift"
          style={{
            width: `${Math.max(50, Math.random() * 100)}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}

// Full page loading skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation skeleton */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-300 rounded-md animate-pulse" />
          <div className="flex space-x-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-6 w-16 bg-gray-300 rounded-md animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Hero skeleton */}
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-4xl mx-auto px-4">
          <div className="h-16 w-full bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-lg mb-6 animate-pulse" />
          <div className="h-8 w-3/4 mx-auto bg-gray-300 rounded-md mb-8 animate-pulse" />
          <div className="flex gap-4 justify-center">
            <div className="h-12 w-32 bg-primary-300 rounded-xl animate-pulse" />
            <div className="h-12 w-32 bg-gray-300 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}