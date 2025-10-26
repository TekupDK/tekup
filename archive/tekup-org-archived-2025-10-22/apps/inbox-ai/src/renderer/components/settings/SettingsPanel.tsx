import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'

interface SettingsPanelProps {
  onClose: () => void
}

type SettingsTab = 'accounts' | 'ai' | 'general'

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { state } = useApp()
  const [activeTab, setActiveTab] = useState<SettingsTab>('accounts')

  const tabs = [
    { id: 'accounts', label: 'Email Accounts', icon: '📧' },
    { id: 'ai', label: 'AI Providers', icon: '🤖' },
    { id: 'general', label: 'General', icon: '⚙️' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'accounts':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Email Accounts</h3>
            <p className="text-gray-600 mb-4">Manage your email accounts and IMAP settings.</p>
            
            <div className="space-y-3">
              {state.accounts.map((account) => (
                <div key={account.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{account.emailAddress}</p>
                      <p className="text-sm text-gray-500">{account.imap.host}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        Edit
                      </button>
                      <button className="text-sm text-red-600 hover:text-red-800">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100">
              Add New Account
            </button>
          </div>
        )
      
      case 'ai':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">AI Providers</h3>
            <p className="text-gray-600 mb-4">Configure AI services for email processing and composition.</p>
            
            <div className="space-y-3">
              {state.aiProviders.map((provider) => (
                <div key={provider.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{provider.name}</p>
                      <p className="text-sm text-gray-500">{provider.type}</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        provider.isDefault
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {provider.isDefault ? 'Default' : 'Available'}
                      </span>
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100">
              Add AI Provider
            </button>
          </div>
        )
      
      case 'general':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Interval (minutes)
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications" className="ml-2 block text-sm text-gray-900">
                  Enable desktop notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autostart"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autostart" className="ml-2 block text-sm text-gray-900">
                  Start app automatically
                </label>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="w-full h-full bg-white flex">
      {/* Sidebar */}
      <div className="w-1/4 border-r border-gray-200 p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  )
}