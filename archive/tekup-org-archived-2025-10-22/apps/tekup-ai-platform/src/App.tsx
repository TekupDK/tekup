import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
// Note: Using a placeholder for toast notifications - replace with your preferred toast library
// import { Toaster } from 'react-hot-toast'

// Context Providers
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AIServiceProvider } from './contexts/AIServiceContext'

// Layout Components
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// Page Components
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/auth/LoginPage'

// Micro-frontend Components (lazy loaded)
const ProposalEngineApp = React.lazy(() => import('./microfrontends/ProposalEngineApp'))
const ContentGeneratorApp = React.lazy(() => import('./microfrontends/ContentGeneratorApp'))
const CustomerSupportApp = React.lazy(() => import('./microfrontends/CustomerSupportApp'))
const CRMApp = React.lazy(() => import('./microfrontends/CRMApp'))
const MarketingApp = React.lazy(() => import('./microfrontends/MarketingApp'))
const ProjectManagementApp = React.lazy(() => import('./microfrontends/ProjectManagementApp'))
const AnalyticsApp = React.lazy(() => import('./microfrontends/AnalyticsApp'))
const VoiceAIApp = React.lazy(() => import('./microfrontends/VoiceAIApp'))
const BusinessIntelligenceApp = React.lazy(() => import('./microfrontends/BusinessIntelligenceApp'))

// Settings and Configuration
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))
const AdminPage = React.lazy(() => import('./pages/AdminPage'))

// Loading component for micro-frontends
function MicroFrontendLoader({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="micro-frontend-loading">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Indlæser AI service...</p>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // This will be implemented with actual auth logic
  const isAuthenticated = true; // TODO: Replace with real auth check
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AIServiceProvider>
          <div className="min-h-screen bg-slate-900">
            <Routes>
              {/* Authentication Routes */}
              <Route path="/login" element={
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              } />
              
              {/* Main Application Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                {/* Dashboard */}
                <Route index element={<DashboardPage />} />
                
                {/* AI Service Routes */}
                <Route path="proposal-engine/*" element={
                  <MicroFrontendLoader>
                    <ProposalEngineApp />
                  </MicroFrontendLoader>
                } />
                
                <Route path="content-generator/*" element={
                  <MicroFrontendLoader>
                    <ContentGeneratorApp />
                  </MicroFrontendLoader>
                } />
                
                <Route path="customer-support/*" element={
                  <MicroFrontendLoader>
                    <CustomerSupportApp />
                  </MicroFrontendLoader>
                } />
                
                <Route path="crm/*" element={
                  <MicroFrontendLoader>
                    <CRMApp />
                  </MicroFrontendLoader>
                } />
                
                <Route path="marketing/*" element={
                  <MicroFrontendLoader>
                    <MarketingApp />
                  </MicroFrontendLoader>
                } />
                
                <Route path="project-management/*" element={
                  <MicroFrontendLoader>
                    <ProjectManagementApp />
                  </MicroFrontendLoader>
                } />
                
                <Route path="analytics/*" element={
                  <MicroFrontendLoader>
                    <AnalyticsApp />
                  </MicroFrontendLoader>
                } />
                
                <Route path="voice-ai/*" element={
                  <MicroFrontendLoader>
                    <VoiceAIApp />
                  </MicroFrontendLoader>
                } />
                
                <Route path="business-intelligence/*" element={
                  <MicroFrontendLoader>
                    <BusinessIntelligenceApp />
                  </MicroFrontendLoader>
                } />
                
                {/* Settings and Admin */}
                <Route path="settings/*" element={
                  <MicroFrontendLoader>
                    <SettingsPage />
                  </MicroFrontendLoader>
                } />
                
                <Route path="admin/*" element={
                  <MicroFrontendLoader>
                    <AdminPage />
                  </MicroFrontendLoader>
                } />
                
                {/* Catch all - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
            
            {/* Global Toast Notifications - TODO: Implement when toast library is added */}
            {/* <Toaster /> */}
          </div>
        </AIServiceProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
