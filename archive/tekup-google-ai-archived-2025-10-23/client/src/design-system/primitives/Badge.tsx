/**
 * RenOS Design System - Badge Component
 * 
 * Small label for status indicators and tags
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-full font-medium',
    'transition-colors duration-200',
    'whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-700 border border-gray-300',
        brand: 'bg-brand-100 text-brand-700 border border-brand-300',
        success: 'bg-success-100 text-success-700 border border-success-300',
        warning: 'bg-warning-100 text-warning-700 border border-warning-300',
        danger: 'bg-danger-100 text-danger-700 border border-danger-300',
        info: 'bg-info-100 text-info-700 border border-info-300',
        solid: 'bg-gray-900 text-white',
        outline: 'bg-transparent text-gray-700 border border-gray-300',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-1 text-sm gap-1.5',
        lg: 'px-3 py-1.5 text-base gap-2',
      },
      dot: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      dot: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Badge content
   */
  children?: React.ReactNode;
  
  /**
   * Show status dot before text
   */
  dot?: boolean;
  
  /**
   * Optional icon
   */
  icon?: React.ReactNode;
}

const Dot = ({ variant }: { variant?: string }) => {
  const dotColor = {
    default: 'bg-gray-500',
    brand: 'bg-brand-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-info-500',
    solid: 'bg-white',
    outline: 'bg-gray-500',
  }[variant || 'default'];

  return <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />;
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && <Dot variant={variant || 'default'} />}
        {icon && <span className="inline-flex">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
