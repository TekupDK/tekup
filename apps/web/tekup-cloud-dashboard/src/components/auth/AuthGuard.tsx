import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoginForm } from './LoginForm';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if demo mode is active
    const demoMode = localStorage.getItem('tekup-demo-mode') === 'true';
    setIsDemoMode(demoMode);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Allow access in demo mode or if user is authenticated
  if (!user && !isDemoMode) {
    return <LoginForm />;
  }

  return <>{children}</>;
}