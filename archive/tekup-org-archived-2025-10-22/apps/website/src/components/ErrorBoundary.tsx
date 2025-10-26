import { AlertTriangle, X } from "lucide-react";

interface ErrorBoundaryProps {
  error: string;
  onDismiss?: () => void;
  retry?: () => void;
}

const ErrorBoundary = ({ error, onDismiss, retry }: ErrorBoundaryProps) => {
  return (
    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 mx-4 my-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Der opstod en fejl</h3>
            <p className="text-red-300 mb-4">{error}</p>
            <div className="flex space-x-3">
              {retry && (
                <button
                  onClick={retry}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Prøv igen
                </button>
              )}
              <button
                onClick={onDismiss}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Luk
              </button>
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary;