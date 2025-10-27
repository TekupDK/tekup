import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { AuthProvider } from "./components/auth/AuthProvider";
import { AuthGuard } from "./components/auth/AuthGuard";
import { AppProvider } from "./contexts/AppProvider";
import { Sidebar } from "./components/layout/Sidebar";
import { TopNav } from "./components/layout/TopNav";
import { JarvisChat } from "./components/ai/JarvisChat";
import { Dashboard } from "./pages/Dashboard";
import { Leads } from "./pages/Leads";
import { SystemHealth } from "./pages/SystemHealth";
import { Agents } from "./pages/Agents";
import { Settings } from "./pages/Settings";
import { Analytics } from "./pages/Analytics";
import { Integrations } from "./pages/Integrations";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGuard>
          <AppProvider>
            <Router>
              <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <TopNav />
                  <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/leads" element={<Leads />} />
                      <Route path="/system-health" element={<SystemHealth />} />
                      <Route path="/agents" element={<Agents />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/integrations" element={<Integrations />} />
                    </Routes>
                  </main>
                </div>
                <JarvisChat />
              </div>
            </Router>
          </AppProvider>
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
