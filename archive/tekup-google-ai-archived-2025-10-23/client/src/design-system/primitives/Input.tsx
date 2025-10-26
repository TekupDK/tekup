/**
 * RenOS Design System - Input Component
 * 
 * Accessible text input with validation states
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const inputVariants = cva(
  [
    'w-full rounded-lg px-3 py-2',
    'text-base text-gray-900 placeholder:text-gray-400',
    'border bg-white',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-gray-300',
          'focus:border-brand-500 focus:ring-brand-200',
          'hover:border-gray-400',
        ],
        error: [
          'border-danger-300 bg-danger-50',
          'focus:border-danger-500 focus:ring-danger-200',
        ],
        success: [
          'border-success-300 bg-success-50',
          'focus:border-success-500 focus:ring-success-200',
        ],
      },
      size: {
        sm: 'h-8 px-2.5 text-sm',
        md: 'h-10 px-3 text-base',
        lg: 'h-12 px-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /**
   * Label text
   */
  label?: string;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Success message to display
   */
  success?: string;
  
  /**
   * Helper text below input
   */
  helperText?: string;
  
  /**
   * Icon to display before input
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Icon to display after input
   */
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant: variantProp,
      size,
      label,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    // Auto-detect variant from validation state
    const variant = error ? 'error' : success ? 'success' : variantProp;
    
    // Generate unique ID if not provided
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              inputVariants({ variant, size }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-danger-600" role="alert">
            {error}
          </p>
        )}
        
        {success && !error && (
          <p className="mt-1.5 text-sm text-success-600">{success}</p>
        )}
        
        {helperText && !error && !success && (
          <p id={helperId} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
