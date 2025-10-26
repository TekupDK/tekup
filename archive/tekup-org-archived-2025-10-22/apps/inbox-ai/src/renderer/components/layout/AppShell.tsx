import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { EmailList } from '../email/EmailList'
import { EmailViewer } from '../email/EmailViewer'
import { EmailCompose } from '../email/EmailCompose'
import { SettingsPanel } from '../settings/SettingsPanel'
import { NotificationContainer } from '../common/NotificationContainer'
import { MCPDashboard } from '../mcp/MCPDashboard'

export function AppShell() {
  const { state } = useApp()
  const [showCompose, setShowCompose] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleComposeEmail = () => {
    setShowCompose(true)
  }

  const handleCloseCompose = () => {
    setShowCompose(false)
  }

  const handleShowSettings = () => {
    setShowSettings(true)
  }

  const handleCloseSettings = () => {
    setShowSettings(false)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header 
        onComposeEmail={handleComposeEmail}
        onShowSettings={handleShowSettings}
      />
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          collapsed={state.sidebarCollapsed}
          onComposeEmail={handleComposeEmail}
        />
        
        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Settings Panel */}
          {showSettings ? (
            <SettingsPanel onClose={handleCloseSettings} />
          ) : state.currentView === 'mcp' ? (
            <div className="flex-1 overflow-hidden">
              <MCPDashboard />
            </div>
          ) : (
            <>
              {/* Email List */}
              <div className={`${state.currentEmail ? 'w-2/5' : 'flex-1'} border-r border-gray-200 overflow-hidden`}>
                <EmailList />
              </div>
              
              {/* Email Viewer */}
              {state.currentEmail && (
                <div className="w-3/5 overflow-hidden">
                  <EmailViewer email={state.currentEmail} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Compose Modal */}
      {showCompose && (
        <EmailCompose onClose={handleCloseCompose} />
      )}
      
      {/* Notifications */}
      <NotificationContainer notifications={state.notifications} />
    </div>
  )
}

// Mobile responsive layout component
export function MobileAppShell() {
  const { state } = useApp()
  const [currentPane, setCurrentPane] = useState<'sidebar' | 'list' | 'viewer' | 'settings'>('list')
  const [showCompose, setShowCompose] = useState(false)

  const handleComposeEmail = () => {
    setShowCompose(true)
  }

  const handleCloseCompose = () => {
    setShowCompose(false)
  }

  const renderCurrentPane = () => {
    switch (currentPane) {
      case 'sidebar':
        return (
          <Sidebar 
            collapsed={false}
            onComposeEmail={handleComposeEmail}
            onNavigate={() => setCurrentPane('list')}
          />
        )
      
      case 'list':
        return (
          <EmailList 
            onEmailSelect={() => setCurrentPane('viewer')}
          />
        )
      
      case 'viewer':
        if (!state.currentEmail) {
          setCurrentPane('list')
          return null
        }
        return (
          <EmailViewer 
            email={state.currentEmail} 
            onBack={() => setCurrentPane('list')}
          />
        )
      
      case 'settings':
        return (
          <SettingsPanel onClose={() => setCurrentPane('list')} />
        )
      
      default:
        // Handle MCP view or fallback to email list based on current view
        if (state.currentView === 'mcp') {
          return <MCPDashboard />
        }
        return <EmailList onEmailSelect={() => setCurrentPane('viewer')} />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <Header 
        onComposeEmail={handleComposeEmail}
        onShowSettings={() => setCurrentPane('settings')}
        onShowSidebar={() => setCurrentPane('sidebar')}
        mobile
      />
      
      {/* Mobile content */}
      <div className="flex-1 overflow-hidden">
        {renderCurrentPane()}
      </div>
      
      {/* Compose Modal */}
      {showCompose && (
        <EmailCompose onClose={handleCloseCompose} mobile />
      )}
      
      {/* Notifications */}
      <NotificationContainer notifications={state.notifications} mobile />
    </div>
  )
}

// Responsive wrapper that switches between desktop and mobile layouts
export function ResponsiveAppShell() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile ? <MobileAppShell /> : <AppShell />
}