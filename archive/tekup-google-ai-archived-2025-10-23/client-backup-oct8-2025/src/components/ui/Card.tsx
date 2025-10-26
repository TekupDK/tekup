import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn('glass-card', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('flex flex-col space-y-2 p-6', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }: CardProps) {
  return (
    <h3
      className={cn('text-xl font-bold leading-none', className)}
      style={{ color: 'var(--color-text-primary)' }}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }: CardProps) {
  return (
    <p
      className={cn('text-sm', className)}
      style={{ color: 'var(--color-text-muted)' }}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardContent({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  )
}
