import React from 'react'

interface LoadingScreenProps {
  message?: string
  progress?: number
  showSpinner?: boolean
}

export function LoadingScreen({ 
  message = 'Loading...', 
  progress, 
  showSpinner = true 
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        {/* Logo/Icon */}
        <div className="mx-auto mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          AI IMAP Inbox
        </h1>
        
        {/* Loading message */}
        <p className="text-gray-600 mb-8">{message}</p>
        
        {/* Spinner */}
        {showSpinner && (
          <div className="mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          </div>
        )}
        
        {/* Progress bar */}
        {progress !== undefined && (
          <div className="max-w-xs mx-auto">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Smaller loading spinner for inline use
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }
  
  return (
    <div className={`animate-spin rounded-full border-2 border-blue-600 border-t-transparent ${sizeClasses[size]} ${className}`}></div>
  )
}

// Skeleton loading for content
interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded h-4 ${index > 0 ? 'mt-2' : ''} ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

// Skeleton for email list items
export function EmailSkeleton() {
  return (
    <div className="border-b border-gray-200 p-4 animate-pulse">
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          {/* Sender */}
          <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
          
          {/* Subject */}
          <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
          
          {/* Preview */}
          <div className="h-3 bg-gray-200 rounded w-64" />
        </div>
        
        {/* Timestamp */}
        <div className="h-3 bg-gray-200 rounded w-16 flex-shrink-0" />
      </div>
    </div>
  )
}