import Navigation from "@/components/Navigation";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { PWAUpdateManager } from "./components/PWAUpdateManager";
import AIModels from "./pages/AIModels";
import CRM from "./pages/CRM";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => {
  // PWA initialization - only in production
  useEffect(() => {
    if (import.meta.env.PROD) {
      // Import and initialize PWA only in production
      import('./utils/pwa').then(({ initializePWA }) => {
        initializePWA();
      }).catch(console.error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          {/* Global fixed navigation */}
          <Navigation />
          {/* Spacer for fixed header height */}
          <div className="h-20 md:h-24" />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ai-models" element={<AIModels />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
        {import.meta.env.PROD && <PWAUpdateManager />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;