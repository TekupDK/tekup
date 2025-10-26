import * as React from 'react'
import clsx from 'clsx'

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary/15 text-foreground border border-secondary/30',
  outline: 'border border-border text-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
          variantStyles[variant],
          className,
        )}
        {...props}
      />
    )
  },
)

Badge.displayName = 'Badge'
