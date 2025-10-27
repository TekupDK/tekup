import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { LoginForm } from "./LoginForm";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if demo mode is active
    const currentDemo = localStorage.getItem("tekup-demo-mode") === "true";
    setIsDemoMode(currentDemo);

    // Support enabling demo mode via URL query (?demo=1 or ?demo=true)
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get("demo");
    if (
      !currentDemo &&
      demoParam &&
      ["1", "true", "yes"].includes(demoParam.toLowerCase())
    ) {
      localStorage.setItem("tekup-demo-mode", "true");
      setIsDemoMode(true);
      // Redirect to dashboard (use hard navigation to avoid router timing issues)
      if (!window.location.pathname.startsWith("/dashboard")) {
        window.location.href = "/dashboard";
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Authenticating...
          </p>
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
