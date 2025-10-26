/**
 * RenOS Design System - Dialog Component
 * 
 * Modal dialog built on Radix UI with custom styling
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const dialogContentVariants = cva(
  [
    'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
    'bg-white rounded-2xl shadow-2xl',
    'w-full max-h-[85vh] overflow-y-auto',
    'focus:outline-none',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface DialogProps extends DialogPrimitive.DialogProps {
  /**
   * Dialog size variant
   */
  size?: VariantProps<typeof dialogContentVariants>['size'];
  
  /**
   * Dialog content
   */
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  children,
  ...props
}) => {
  return (
    <DialogPrimitive.Root {...props}>
      {children}
    </DialogPrimitive.Root>
  );
};

Dialog.displayName = 'Dialog';

export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogPortal = DialogPrimitive.Portal;

export const DialogClose = DialogPrimitive.Close;

/**
 * Dialog Overlay - Background overlay with animation
 */
export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Dialog Content - Main content container with animation
 */
export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  /**
   * Show close button
   */
  showClose?: boolean;
}

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, size, showClose = true, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        dialogContentVariants({ size }),
        'z-50',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]',
        className
      )}
      {...props}
    >
      {children}
      
      {showClose && (
        <DialogPrimitive.Close
          className={cn(
            'absolute right-4 top-4',
            'rounded-lg p-2',
            'text-gray-400 hover:text-gray-600',
            'hover:bg-gray-100',
            'transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
          )}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));

DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * Dialog Header - Header section with title and description
 */
export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex flex-col space-y-2 px-6 pt-6 pb-4',
      'border-b border-gray-100',
      className
    )}
    {...props}
  />
);

DialogHeader.displayName = 'DialogHeader';

/**
 * Dialog Footer - Footer section with actions
 */
export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex items-center justify-end gap-3 px-6 py-4',
      'border-t border-gray-100',
      className
    )}
    {...props}
  />
);

DialogFooter.displayName = 'DialogFooter';

/**
 * Dialog Title - Styled title
 */
export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-2xl font-semibold text-gray-900',
      'tracking-tight',
      className
    )}
    {...props}
  />
));

DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * Dialog Description - Styled description
 */
export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
));

DialogDescription.displayName = DialogPrimitive.Description.displayName;

/**
 * Dialog Body - Main content area
 */
export const DialogBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn('px-6 py-4', className)}
    {...props}
  />
);

DialogBody.displayName = 'DialogBody';
