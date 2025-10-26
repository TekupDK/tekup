/**
 * RenOS Design System - Skeleton Component
 * 
 * Loading placeholder with shimmer animation
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const skeletonVariants = cva(
  [
    'animate-pulse rounded-lg bg-gray-200',
    'relative overflow-hidden',
    'before:absolute before:inset-0',
    'before:-translate-x-full',
    'before:animate-shimmer',
    'before:bg-gradient-to-r',
    'before:from-transparent before:via-white/60 before:to-transparent',
  ],
  {
    variants: {
      variant: {
        default: '',
        circle: 'rounded-full',
        text: 'h-4 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /**
   * Width of skeleton (CSS value)
   */
  width?: string | number;
  
  /**
   * Height of skeleton (CSS value)
   */
  height?: string | number;
  
  /**
   * Number of lines for text skeleton
   */
  lines?: number;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, width, height, lines, style, ...props }, ref) => {
    // If lines is specified, render multiple text skeletons
    if (lines && lines > 1) {
      return (
        <div className="space-y-2" ref={ref}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(skeletonVariants({ variant: 'text' }), className)}
              style={{
                width: i === lines - 1 ? '70%' : '100%',
                ...style,
              }}
              {...props}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant }), className)}
        style={{
          width,
          height,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Skeleton Card - Pre-composed skeleton for card loading
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn('rounded-xl border border-gray-200 bg-white p-6', className)}>
    <div className="space-y-4">
      <Skeleton height="24px" width="60%" />
      <Skeleton height="16px" lines={3} />
      <div className="flex gap-2 pt-2">
        <Skeleton height="32px" width="80px" />
        <Skeleton height="32px" width="80px" />
      </div>
    </div>
  </div>
);

SkeletonCard.displayName = 'SkeletonCard';

/**
 * Skeleton Avatar - Pre-composed skeleton for avatar loading
 */
export const SkeletonAvatar: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 40, className }) => (
  <Skeleton
    variant="circle"
    width={size}
    height={size}
    className={className}
  />
);

SkeletonAvatar.displayName = 'SkeletonAvatar';

/**
 * Skeleton Text - Pre-composed skeleton for text loading
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 1, className }) => (
  <Skeleton variant="text" lines={lines} className={className} />
);

SkeletonText.displayName = 'SkeletonText';
