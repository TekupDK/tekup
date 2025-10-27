import { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const baseStyles = 'bg-gray-200 dark:bg-gray-700';

  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const inlineStyles = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${animations[animation]} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
}

export function SkeletonText({ lines = 3, lastLineWidth = '80%' }: SkeletonTextProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height={16}
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

export interface SkeletonCardProps {
  showImage?: boolean;
}

export function SkeletonCard({ showImage = true }: SkeletonCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4 border border-gray-200 dark:border-gray-700">
      {showImage && <Skeleton height={200} variant="rectangular" />}
      <div className="space-y-2">
        <Skeleton height={24} width="60%" variant="text" />
        <SkeletonText lines={3} />
      </div>
    </div>
  );
}
