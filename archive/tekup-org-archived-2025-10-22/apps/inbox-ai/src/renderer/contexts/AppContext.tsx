import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { EmailAccount, AIProvider, AppSettings, Email } from '@shared/types'

// State interface
interface AppState {
  // Accounts
  accounts: EmailAccount[]
  currentAccount: EmailAccount | null
  
  // AI Providers
  aiProviders: AIProvider[]
  currentAIProvider: AIProvider | null
  
  // Settings
  settings: AppSettings | null
  
  // UI State
  sidebarCollapsed: boolean
  currentView: 'inbox' | 'sent' | 'drafts' | 'trash' | 'settings' | 'mcp'
  
  // Email State
  emails: Email[]
  selectedEmails: string[]
  currentEmail: Email | null
  
  // Loading States
  isLoading: boolean
  isSyncing: boolean
  
  // Notifications
  notifications: Notification[]
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  duration?: number
}

// Action types
type AppAction =
  | { type: 'SET_ACCOUNTS'; payload: EmailAccount[] }
  | { type: 'ADD_ACCOUNT'; payload: EmailAccount }
  | { type: 'REMOVE_ACCOUNT'; payload: string }
  | { type: 'SET_CURRENT_ACCOUNT'; payload: EmailAccount | null }
  | { type: 'SET_AI_PROVIDERS'; payload: AIProvider[] }
  | { type: 'ADD_AI_PROVIDER'; payload: AIProvider }
  | { type: 'REMOVE_AI_PROVIDER'; payload: string }
  | { type: 'SET_CURRENT_AI_PROVIDER'; payload: AIProvider | null }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_CURRENT_VIEW'; payload: AppState['currentView'] }
  | { type: 'SET_EMAILS'; payload: Email[] }
  | { type: 'ADD_EMAILS'; payload: Email[] }
  | { type: 'UPDATE_EMAIL'; payload: Email }
  | { type: 'REMOVE_EMAIL'; payload: string }
  | { type: 'SET_SELECTED_EMAILS'; payload: string[] }
  | { type: 'TOGGLE_EMAIL_SELECTION'; payload: string }
  | { type: 'SET_CURRENT_EMAIL'; payload: Email | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }

// Initial state
const initialState: AppState = {
  accounts: [],
  currentAccount: null,
  aiProviders: [],
  currentAIProvider: null,
  settings: null,
  sidebarCollapsed: false,
  currentView: 'inbox',
  emails: [],
  selectedEmails: [],
  currentEmail: null,
  isLoading: false,
  isSyncing: false,
  notifications: []
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ACCOUNTS':
      return {
        ...state,
        accounts: action.payload,
        currentAccount: action.payload[0] || null
      }
    
    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
        currentAccount: state.currentAccount || action.payload
      }
    
    case 'REMOVE_ACCOUNT':
      const filteredAccounts = state.accounts.filter(acc => acc.id !== action.payload)
      return {
        ...state,
        accounts: filteredAccounts,
        currentAccount: state.currentAccount?.id === action.payload 
          ? filteredAccounts[0] || null 
          : state.currentAccount
      }
    
    case 'SET_CURRENT_ACCOUNT':
      return {
        ...state,
        currentAccount: action.payload,
        emails: [], // Clear emails when switching accounts
        selectedEmails: [],
        currentEmail: null
      }
    
    case 'SET_AI_PROVIDERS':
      return {
        ...state,
        aiProviders: action.payload,
        currentAIProvider: action.payload.find(p => p.isDefault) || action.payload[0] || null
      }
    
    case 'ADD_AI_PROVIDER':
      return {
        ...state,
        aiProviders: [...state.aiProviders, action.payload]
      }
    
    case 'REMOVE_AI_PROVIDER':
      const filteredProviders = state.aiProviders.filter(p => p.id !== action.payload)
      return {
        ...state,
        aiProviders: filteredProviders,
        currentAIProvider: state.currentAIProvider?.id === action.payload
          ? filteredProviders[0] || null
          : state.currentAIProvider
      }
    
    case 'SET_CURRENT_AI_PROVIDER':
      return {
        ...state,
        currentAIProvider: action.payload
      }
    
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.payload
      }
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: state.settings ? { ...state.settings, ...action.payload } : action.payload as AppSettings
      }
    
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed
      }
    
    case 'SET_CURRENT_VIEW':
      return {
        ...state,
        currentView: action.payload
      }
    
    case 'SET_EMAILS':
      return {
        ...state,
        emails: action.payload,
        selectedEmails: [], // Clear selection when emails change
        currentEmail: null
      }
    
    case 'ADD_EMAILS':
      return {
        ...state,
        emails: [...state.emails, ...action.payload]
      }
    
    case 'UPDATE_EMAIL':
      return {
        ...state,
        emails: state.emails.map(email => 
          email.id === action.payload.id ? action.payload : email
        ),
        currentEmail: state.currentEmail?.id === action.payload.id ? action.payload : state.currentEmail
      }
    
    case 'REMOVE_EMAIL':
      return {
        ...state,
        emails: state.emails.filter(email => email.id !== action.payload),
        selectedEmails: state.selectedEmails.filter(id => id !== action.payload),
        currentEmail: state.currentEmail?.id === action.payload ? null : state.currentEmail
      }
    
    case 'SET_SELECTED_EMAILS':
      return {
        ...state,
        selectedEmails: action.payload
      }
    
    case 'TOGGLE_EMAIL_SELECTION':
      const isSelected = state.selectedEmails.includes(action.payload)
      return {
        ...state,
        selectedEmails: isSelected
          ? state.selectedEmails.filter(id => id !== action.payload)
          : [...state.selectedEmails, action.payload]
      }
    
    case 'SET_CURRENT_EMAIL':
      return {
        ...state,
        currentEmail: action.payload
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    
    case 'SET_SYNCING':
      return {
        ...state,
        isSyncing: action.payload
      }
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }
    
    default:
      return state
  }
}

// Context
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  
  // Helper functions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  syncAccount: (accountId: string) => Promise<void>
  loadEmails: (accountId: string, folderId?: string) => Promise<void>
  switchAccount: (account: EmailAccount) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider props
interface AppProviderProps {
  children: ReactNode
  initialAccounts?: EmailAccount[]
  initialAIProviders?: AIProvider[]
  initialSettings?: AppSettings | null
}

// Provider component
export function AppProvider({ 
  children, 
  initialAccounts = [], 
  initialAIProviders = [], 
  initialSettings = null 
}: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    accounts: initialAccounts,
    currentAccount: initialAccounts[0] || null,
    aiProviders: initialAIProviders,
    currentAIProvider: initialAIProviders.find(p => p.isDefault) || initialAIProviders[0] || null,
    settings: initialSettings
  })

  // Helper functions
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification })
    
    // Auto-remove notification after duration
    if (notification.duration) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: newNotification.id })
      }, notification.duration)
    }
  }
  
  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }
  
  const syncAccount = async (accountId: string) => {
    try {
      dispatch({ type: 'SET_SYNCING', payload: true })
      await window.electronAPI.syncEmails(accountId)
      addNotification({
        type: 'success',
        title: 'Sync Complete',
        message: 'Emails synchronized successfully',
        duration: 3000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: error instanceof Error ? error.message : 'Failed to sync emails',
        duration: 5000
      })
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false })
    }
  }
  
  const loadEmails = async (accountId: string, folderId?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const emails = await window.electronAPI.getEmails(accountId, folderId)
      dispatch({ type: 'SET_EMAILS', payload: emails })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Load Failed',
        message: error instanceof Error ? error.message : 'Failed to load emails',
        duration: 5000
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }
  
  const switchAccount = async (account: EmailAccount) => {
    dispatch({ type: 'SET_CURRENT_ACCOUNT', payload: account })
    await loadEmails(account.id)
  }

  // Listen for new emails from main process
  useEffect(() => {
    const handleNewEmails = ({ accountId, emails }: { accountId: string; emails: Email[] }) => {
      if (accountId === state.currentAccount?.id) {
        dispatch({ type: 'ADD_EMAILS', payload: emails })
        
        if (emails.length > 0) {
          addNotification({
            type: 'info',
            title: 'New Emails',
            message: `${emails.length} new email(s) received`,
            duration: 4000
          })
        }
      }
    }

    window.electronAPI.onEmailReceived(handleNewEmails)
    
    // Cleanup listener on unmount
    return () => {
      // Note: electronAPI doesn't provide removeListener, 
      // this would need to be implemented in preload
    }
  }, [state.currentAccount?.id])

  const contextValue: AppContextType = {
    state,
    dispatch,
    addNotification,
    removeNotification,
    syncAccount,
    loadEmails,
    switchAccount
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}