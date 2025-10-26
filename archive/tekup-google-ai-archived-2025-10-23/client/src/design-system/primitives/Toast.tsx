/**
 * RenOS Design System - Toast Component
 * 
 * Toast notifications built on Radix UI with custom styling
 */

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const toastVariants = cva(
  [
    'group pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-lg border p-4 pr-6 shadow-lg transition-all',
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
    'data-[swipe=move]:transition-none',
    'data-[state=open]:animate-in',
    'data-[state=closed]:animate-out',
    'data-[swipe=end]:animate-out',
    'data-[state=closed]:fade-out-80',
    'data-[state=closed]:slide-out-to-right-full',
    'data-[state=open]:slide-in-from-top-full',
    'data-[state=open]:sm:slide-in-from-bottom-full',
  ],
  {
    variants: {
      variant: {
        default: 'border-gray-200 bg-white text-gray-900',
        success: 'border-success-200 bg-success-50 text-success-900',
        warning: 'border-warning-200 bg-warning-50 text-warning-900',
        danger: 'border-danger-200 bg-danger-50 text-danger-900',
        info: 'border-info-200 bg-info-50 text-info-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors',
      'hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:pointer-events-none disabled:opacity-50',
      'group-[.success]:border-success-200 group-[.success]:hover:bg-success-100',
      'group-[.warning]:border-warning-200 group-[.warning]:hover:bg-warning-100',
      'group-[.danger]:border-danger-200 group-[.danger]:hover:bg-danger-100',
      'group-[.info]:border-info-200 group-[.info]:hover:bg-info-100',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-1 top-1 rounded-md p-1 text-gray-500 opacity-0 transition-opacity',
      'hover:text-gray-900 focus:opacity-100 focus:outline-none focus:ring-1',
      'group-hover:opacity-100',
      className
    )}
    toast-close=""
    {...props}
  >
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold [&+div]:text-xs', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastPrimitives as ToastProvider,
  Toast,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription,
};
