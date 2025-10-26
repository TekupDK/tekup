import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Components
import Header from './Header'
import Sidebar from './Sidebar'
import QuickActions from './QuickActions'
import NotificationCenter from './NotificationCenter'

interface MainLayoutProps {
  children?: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-y-0 left-0 z-50 w-80 lg:static lg:inset-0 lg:z-0"
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header 
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)}
          onToggleQuickActions={() => setQuickActionsOpen(!quickActionsOpen)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Quick Actions Panel */}
      <AnimatePresence>
        {quickActionsOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-y-0 right-0 z-50 w-80"
          >
            <QuickActions onClose={() => setQuickActionsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Center */}
      <AnimatePresence>
        {notificationsOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-y-0 right-0 z-50 w-96"
          >
            <NotificationCenter onClose={() => setNotificationsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions/Notifications Overlay */}
      {(quickActionsOpen || notificationsOpen) && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => {
            setQuickActionsOpen(false)
            setNotificationsOpen(false)
          }}
        />
      )}

      {/* Keyboard Shortcuts */}
      <div className="sr-only">
        <h2>Tastaturgenveje</h2>
        <ul>
          <li>Cmd/Ctrl + K: Søg</li>
          <li>Cmd/Ctrl + /: Vis genveje</li>
          <li>Cmd/Ctrl + B: Toggle sidebar</li>
          <li>Cmd/Ctrl + N: Ny handling</li>
        </ul>
      </div>
    </div>
  )
}

