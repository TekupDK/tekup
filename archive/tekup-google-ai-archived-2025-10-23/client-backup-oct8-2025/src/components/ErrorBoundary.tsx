import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    resetKeys?: Array<string | number>;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch and display errors gracefully
 * Prevents entire app from crashing when a component throws an error
 * 
 * Usage:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Store error info in state
        this.setState({
            error,
            errorInfo
        });

        // Call optional onError callback
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // TODO: Send to Sentry in production
        if (import.meta.env.PROD) {
            // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
        }
    }

    componentDidUpdate(prevProps: Props): void {
        // Reset error state when resetKeys change
        if (this.state.hasError && this.props.resetKeys) {
            const hasResetKeyChanged = this.props.resetKeys.some(
                (key, index) => key !== prevProps.resetKeys?.[index]
            );
            if (hasResetKeyChanged) {
                this.reset();
            }
        }
    }

    reset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="glass-card max-w-2xl w-full p-8 rounded-xl shadow-lg border border-red-500/20">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-semibold text-red-600 mb-2">
                                    Der opstod en fejl
                                </h2>
                                <p className="text-muted-foreground mb-4">
                                    Vi beklager, men noget gik galt. Prøv venligst at genindlæse siden.
                                </p>

                                {/* Show error details in development */}
                                {import.meta.env.DEV && this.state.error && (
                                    <details className="mb-4 p-4 bg-muted/30 rounded-lg border border-border">
                                        <summary className="cursor-pointer text-sm font-medium text-foreground mb-2">
                                            Tekniske detaljer (kun i udvikling)
                                        </summary>
                                        <div className="text-xs font-mono text-muted-foreground space-y-2">
                                            <div>
                                                <strong>Error:</strong> {this.state.error.message}
                                            </div>
                                            {this.state.error.stack && (
                                                <div>
                                                    <strong>Stack:</strong>
                                                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words">
                                                        {this.state.error.stack}
                                                    </pre>
                                                </div>
                                            )}
                                            {this.state.errorInfo?.componentStack && (
                                                <div>
                                                    <strong>Component Stack:</strong>
                                                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words">
                                                        {this.state.errorInfo.componentStack}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={this.reset}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors duration-200"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Prøv igen
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/'}
                                        className="flex items-center gap-2 px-4 py-2 bg-glass hover:bg-glass-secondary border border-border rounded-lg transition-colors duration-200"
                                    >
                                        <Home className="w-4 h-4" />
                                        Gå til forsiden
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
