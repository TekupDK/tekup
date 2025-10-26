import clsx from 'clsx'

interface LoadingSkeletonProps {
  className?: string
  rows?: number
  showAvatar?: boolean
}

export default function LoadingSkeleton({ 
  className = "h-4 w-full", 
  rows = 1,
  showAvatar = false 
}: LoadingSkeletonProps) {
  return (
    <div className={clsx("animate-pulse", className)}>
      {showAvatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full bg-gray-300 h-10 w-10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      )}
      
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={clsx(
          "bg-gray-300 rounded",
          i === 0 ? "h-4" : "h-3",
          i === rows - 1 ? "w-2/3" : "w-full",
          i > 0 && "mt-2"
        )}></div>
      ))}
    </div>
  )
}
