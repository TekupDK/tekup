import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from './button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4">
          <div className="glass rounded-2xl p-8 shadow-2xl border border-glass/30 max-w-2xl w-full animate-fade-in-up">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
              </div>

              {/* Error Message */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Noget gik galt
                </h1>
                <p className="text-muted-foreground">
                  Der opstod en uventet fejl. Vi beklager ulejligheden.
                </p>
              </div>

              {/* Error Details (Development only) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="text-left bg-glass/50 rounded-lg p-4 border border-glass/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-500">Fejldetaljer (kun udvikling)</span>
                  </div>
                  <pre className="text-xs text-muted-foreground overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Prøv igen
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Genindlæs siden
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Gå til forsiden
                </Button>
              </div>

              {/* Support Information */}
              <div className="pt-4 border-t border-glass/30">
                <p className="text-sm text-muted-foreground">
                  Hvis problemet fortsætter, kontakt venligst support på{' '}
                  <a
                    href="mailto:support@rendetalje.dk"
                    className="text-primary hover:underline"
                  >
                    support@rendetalje.dk
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo)

    // You can integrate with error reporting services here
    // Example: Sentry.captureException(error)
  }
}

// Simple error fallback component
export function ErrorFallback({
  error,
  resetError
}: {
  error: Error;
  resetError: () => void
}) {
  return (
    <div className="glass rounded-xl p-6 border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800/30">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <h3 className="font-medium text-red-900 dark:text-red-100">
            Der opstod en fejl
          </h3>
          <p className="text-sm text-red-700 dark:text-red-200">
            {error.message}
          </p>
          <Button
            onClick={resetError}
            size="sm"
            variant="outline"
            className="text-red-700 border-red-300 hover:bg-red-100 dark:text-red-200 dark:border-red-700 dark:hover:bg-red-900/20"
          >
            Prøv igen
          </Button>
        </div>
      </div>
    </div>
  )
}