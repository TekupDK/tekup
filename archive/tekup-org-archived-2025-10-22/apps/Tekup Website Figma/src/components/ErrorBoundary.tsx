'use client';

import React, { Component, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private errorLogTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service (e.g., Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Clear potentially corrupted localStorage data for auth errors
    if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('auth')) {
      console.warn('🔧 Auth error detected, clearing localStorage data to prevent future issues');
      try {
        localStorage.removeItem('tekup_access_token');
        localStorage.removeItem('tekup_refresh_token');
        localStorage.removeItem('tekup_user');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
    }
    
    // Optional: Send error to logging service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // Debounce error logging to prevent spam
    if (this.errorLogTimeout) {
      clearTimeout(this.errorLogTimeout);
    }

    this.errorLogTimeout = setTimeout(() => {
      // Here you would typically send to a service like Sentry, LogRocket, etc.
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      console.log('Error logged:', errorData);
      
      // Example: Send to monitoring service
      // fetch('/api/log-error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // }).catch(console.error);
    }, 1000);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorDetails = `
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
    `.trim();

    const subject = encodeURIComponent('Tekup Website Error Report');
    const body = encodeURIComponent(errorDetails);
    window.open(`mailto:support@tekup.dk?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
          <div className="max-w-2xl mx-auto text-center">
            
            {/* Error Animation */}
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block"
              >
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle className="w-12 h-12 text-white" />
                </div>
              </motion.div>
            </motion.div>

            {/* Error Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Noget gik galt
              </h1>
              <p className="text-xl text-muted-foreground mb-6 max-w-lg mx-auto">
                Vi beklager, men der opstod en uventet fejl. Vores team er blevet notificeret og arbejder på at løse problemet.
              </p>
              
              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left max-w-lg mx-auto mb-6"
                >
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    Error Details (Development Mode):
                  </h3>
                  <code className="text-sm text-red-700 dark:text-red-300 break-all">
                    {this.state.error.message}
                  </code>
                </motion.div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
            >
              <Button 
                onClick={this.handleRetry}
                size="lg"
                className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] text-white px-8 py-3 font-semibold hover:shadow-lg transition-all duration-300"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Prøv igen
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                variant="outline"
                size="lg"
                className="border-[var(--color-tekup-primary-fallback)] text-[var(--color-tekup-primary-fallback)] hover:bg-[var(--color-tekup-primary-fallback)] hover:text-white px-8 py-3 font-semibold transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Gå til forsiden
              </Button>
            </motion.div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Har du brug for hjælp?
              </h3>
              <p className="text-muted-foreground mb-6">
                Hvis problemet fortsætter, så kontakt vores support team. Vi hjælper gerne!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={this.handleReportError}
                  className="border-gray-300 dark:border-gray-600"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Rapporter fejl
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open('https://tekup.dk/support', '_blank')}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Kontakt support
                </Button>
              </div>
            </motion.div>

            {/* Status Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-muted-foreground">
                For status opdateringer, besøg{' '}
                <a 
                  href="https://status.tekup.dk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--color-tekup-primary-fallback)] hover:underline"
                >
                  status.tekup.dk
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}