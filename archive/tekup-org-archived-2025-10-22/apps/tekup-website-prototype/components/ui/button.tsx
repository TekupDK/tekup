import * as React from 'react'
import clsx from 'clsx'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-sm rounded-md',
  lg: 'h-12 px-6 text-base rounded-lg',
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  default:
    'bg-primary text-primary-foreground hover:bg-primary/90 border border-white/20 dark:border-white/10',
  outline:
    'border border-border text-foreground hover:bg-foreground/5 dark:hover:bg-white/5',
  ghost: 'text-foreground hover:bg-foreground/5 dark:hover:bg-white/5',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          sizeStyles[size],
          variantStyles[variant],
          className,
        )}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
