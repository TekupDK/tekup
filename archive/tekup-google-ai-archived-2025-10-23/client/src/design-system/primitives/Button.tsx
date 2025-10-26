/**
 * RenOS Design System - Button Component
 * 
 * Accessible, type-safe button with multiple variants
 * Inspired by Cursor/Linear/Stripe design patterns
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const buttonVariants = cva(
  // Base styles - applied to all buttons
  [
    'inline-flex items-center justify-center',
    'rounded-lg font-medium',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-brand-500 text-white',
          'hover:bg-brand-600 active:bg-brand-700',
          'shadow-sm hover:shadow-md',
          'focus-visible:ring-brand-500',
        ],
        secondary: [
          'bg-gray-100 text-gray-900',
          'hover:bg-gray-200 active:bg-gray-300',
          'border border-gray-300',
          'focus-visible:ring-gray-500',
        ],
        ghost: [
          'bg-transparent text-gray-700',
          'hover:bg-gray-100 active:bg-gray-200',
          'focus-visible:ring-gray-500',
        ],
        danger: [
          'bg-danger-500 text-white',
          'hover:bg-danger-600 active:bg-danger-700',
          'shadow-sm hover:shadow-md',
          'focus-visible:ring-danger-500',
        ],
        success: [
          'bg-success-500 text-white',
          'hover:bg-success-600 active:bg-success-700',
          'shadow-sm hover:shadow-md',
          'focus-visible:ring-success-500',
        ],
        outline: [
          'bg-transparent text-brand-600 border-2 border-brand-500',
          'hover:bg-brand-50 active:bg-brand-100',
          'focus-visible:ring-brand-500',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-sm gap-1.5',
        md: 'h-10 px-4 text-base gap-2',
        lg: 'h-12 px-6 text-lg gap-2.5',
        icon: 'h-10 w-10 p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Button content
   */
  children?: React.ReactNode;
  
  /**
   * Optional icon to display before text
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Optional icon to display after text
   */
  rightIcon?: React.ReactNode;
  
  /**
   * Loading state - shows spinner and disables button
   */
  isLoading?: boolean;
  
  /**
   * When true, renders as <a> tag instead of <button>
   */
  asChild?: boolean;
}

const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width="16"
    height="16"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      children,
      leftIcon,
      rightIcon,
      isLoading,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {isLoading && <Spinner />}
        {!isLoading && leftIcon && <span className="inline-flex">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
