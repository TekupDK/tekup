/**
 * RenOS Design System - Card Component
 * 
 * Flexible container component with elevation levels
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const cardVariants = cva(
  [
    'rounded-xl bg-white',
    'border border-gray-200',
    'transition-all duration-200',
  ],
  {
    variants: {
      elevation: {
        none: '',
        sm: 'shadow-sm hover:shadow-md',
        md: 'shadow-md hover:shadow-lg',
        lg: 'shadow-lg hover:shadow-xl',
        xl: 'shadow-xl hover:shadow-2xl',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:border-brand-300 active:scale-[0.99]',
        false: '',
      },
    },
    defaultVariants: {
      elevation: 'sm',
      padding: 'md',
      interactive: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Card content
   */
  children?: React.ReactNode;
  
  /**
   * Render as different element
   */
  as?: 'div' | 'article' | 'section';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      elevation,
      padding,
      interactive,
      children,
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          cardVariants({ elevation, padding, interactive }),
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card Header - Optional styled header section
 */
export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

/**
 * Card Title - Heading for card header
 */
export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold leading-none tracking-tight text-gray-900', className)}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

/**
 * Card Description - Subtitle for card header
 */
export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

/**
 * Card Content - Main content area
 */
export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
));

CardContent.displayName = 'CardContent';

/**
 * Card Footer - Optional footer section
 */
export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4 border-t border-gray-100', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';
