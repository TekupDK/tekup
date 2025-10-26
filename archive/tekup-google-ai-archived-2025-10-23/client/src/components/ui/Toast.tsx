import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  title: string
  description?: string
  type?: ToastType
  duration?: number
  onClose: (id: string) => void
}

const iconMap = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />
}

const colorMap = {
  success: 'text-green-400 bg-green-400/10 border-green-400/30',
  error: 'text-red-400 bg-red-400/10 border-red-400/30',
  warning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  info: 'text-blue-400 bg-blue-400/10 border-blue-400/30'
}

export function Toast({ id, title, description, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }

  return (
    <div
      className={cn(
        "glass rounded-xl border p-4 shadow-2xl transition-all duration-300 max-w-sm w-full",
        isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", colorMap[type])}>
          {iconMap[type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-glass"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer({ toasts, onClose }: { toasts: Array<Omit<ToastProps, 'onClose'>>, onClose: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}