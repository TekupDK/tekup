import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    error?: Error;
}

/**
 * ErrorState component for displaying inline error messages
 * Use this for fetch errors, API failures, etc. within a section
 * 
 * Usage:
 * {error && <ErrorState message="Failed to load data" onRetry={refetch} />}
 */
const ErrorState = ({
    title = 'Der opstod en fejl',
    message = 'Kunne ikke indlæse data. Prøv venligst igen.',
    onRetry,
    error
}: ErrorStateProps) => {
    return (
        <div className="flex items-center justify-center p-8">
            <div className="glass-card max-w-md w-full p-6 rounded-xl border border-red-500/20">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-red-600 mb-1">
                            {title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {message}
                        </p>

                        {/* Show error details in development */}
                        {import.meta.env.DEV && error && (
                            <details className="mb-4 p-3 bg-muted/30 rounded border border-border">
                                <summary className="cursor-pointer text-xs font-medium text-foreground mb-1">
                                    Tekniske detaljer
                                </summary>
                                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words mt-2">
                                    {error.message}
                                    {error.stack && `\n\n${error.stack}`}
                                </pre>
                            </details>
                        )}

                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors duration-200 text-sm"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Prøv igen
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorState;
