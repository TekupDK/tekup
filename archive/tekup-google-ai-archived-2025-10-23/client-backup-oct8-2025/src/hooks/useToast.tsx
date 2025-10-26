import { useState, useCallback } from 'react'
import { ToastType } from '../components/ui/Toast'

interface Toast {
  id: string
  title: string
  description?: string
  type?: ToastType
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    const newToast = { ...options, id }
    
    setToasts(prev => [...prev, newToast])
  }, [])

  const success = useCallback((title: string, description?: string) => {
    toast({ title, description, type: 'success' })
  }, [toast])

  const error = useCallback((title: string, description?: string) => {
    toast({ title, description, type: 'error' })
  }, [toast])

  const warning = useCallback((title: string, description?: string) => {
    toast({ title, description, type: 'warning' })
  }, [toast])

  const info = useCallback((title: string, description?: string) => {
    toast({ title, description, type: 'info' })
  }, [toast])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    removeToast
  }
}