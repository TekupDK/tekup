import React from 'react'
import { useApp } from '../../contexts/AppContext'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, InboxIcon, PaperAirplaneIcon, DocumentIcon, TrashIcon, CogIcon } from '@heroicons/react/24/outline'

interface SidebarProps {
  collapsed?: boolean
  onComposeEmail?: () => void
  onNavigate?: () => void
}

export function Sidebar({ collapsed = false, onComposeEmail, onNavigate }: SidebarProps) {
  const { state, dispatch, switchAccount } = useApp()

  const handleViewChange = (view: typeof state.currentView) => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: view })
    onNavigate?.()
  }

  return (
    <div className={`bg-gray-800 text-white transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        {!collapsed && (
          <h2 className="text-lg font-semibold">AI IMAP Inbox</h2>
        )}
      </div>

      {/* Compose Button */}
      <div className="p-4">
        <button
          onClick={onComposeEmail}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {collapsed ? '+' : 'Compose'}
        </button>
      </div>

      {/* Account List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          {!collapsed && (
            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
              Accounts
            </h3>
          )}
          <div className="mt-2 space-y-1">
            {state.accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => switchAccount(account)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  state.currentAccount?.id === account.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {collapsed ? account.emailAddress[0].toUpperCase() : account.emailAddress}
              </button>
            ))}
          </div>
        </div>

        {/* Folders */}
        {!collapsed && state.currentAccount && (
          <div className="px-4 py-2 mt-4">
            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
              Folders
            </h3>
            <div className="mt-2 space-y-1">
              <button 
                onClick={() => handleViewChange('inbox')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center ${
                  state.currentView === 'inbox'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <InboxIcon className="w-4 h-4 mr-2" />
                Inbox
              </button>
              <button 
                onClick={() => handleViewChange('sent')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center ${
                  state.currentView === 'sent'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                Sent
              </button>
              <button 
                onClick={() => handleViewChange('drafts')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center ${
                  state.currentView === 'drafts'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <DocumentIcon className="w-4 h-4 mr-2" />
                Drafts
              </button>
              <button 
                onClick={() => handleViewChange('trash')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center ${
                  state.currentView === 'trash'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Trash
              </button>
            </div>
          </div>
        )}

        {/* MCP Dashboard */}
        <div className="px-4 py-2 mt-4">
          {!collapsed && (
            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
              AI Tools
            </h3>
          )}
          <div className="mt-2 space-y-1">
            <button 
              onClick={() => handleViewChange('mcp')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center ${
                state.currentView === 'mcp'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <CogIcon className="w-4 h-4 mr-2" />
              {collapsed ? '' : 'MCP Dashboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}