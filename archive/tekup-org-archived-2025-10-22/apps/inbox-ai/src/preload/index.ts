import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Email operations
  addEmailAccount: (config: any) => ipcRenderer.invoke('email:addAccount', config),
  removeEmailAccount: (accountId: string) => ipcRenderer.invoke('email:removeAccount', accountId),
  syncEmails: (accountId: string) => ipcRenderer.invoke('email:sync', accountId),
  getEmails: (accountId: string, folderId?: string, limit?: number, offset?: number) => 
    ipcRenderer.invoke('email:getEmails', accountId, folderId, limit, offset),
  getEmail: (emailId: string) => ipcRenderer.invoke('email:getEmail', emailId),
  getFolders: (accountId: string) => ipcRenderer.invoke('email:getFolders', accountId),
  searchEmails: (query: any) => ipcRenderer.invoke('email:search', query),
  performEmailAction: (action: any) => ipcRenderer.invoke('email:action', action),

  // AI operations
  summarizeEmail: (email: any) => ipcRenderer.invoke('ai:summarize', email),
  composeReply: (context: any) => ipcRenderer.invoke('ai:composeReply', context),
  categorizeEmail: (email: any) => ipcRenderer.invoke('ai:categorize', email),
  generateDraft: (prompt: string, context?: any) => ipcRenderer.invoke('ai:generateDraft', prompt, context),
  extractActionItems: (email: any) => ipcRenderer.invoke('ai:extractActionItems', email),
  getAIStatus: () => ipcRenderer.invoke('ai:getStatus'),
  switchAIProvider: (providerId: string) => ipcRenderer.invoke('ai:switchProvider', providerId),

  // Chatbot operations
  chatbot: {
    sendMessage: (request: any) => ipcRenderer.invoke('chatbot:sendMessage', request),
    getConversations: () => ipcRenderer.invoke('chatbot:getConversations'),
    deleteConversation: (conversationId: string) => ipcRenderer.invoke('chatbot:deleteConversation', conversationId),
    updateConfig: (config: any) => ipcRenderer.invoke('chatbot:updateConfig', config),
    getConfig: () => ipcRenderer.invoke('chatbot:getConfig'),
    executeAction: (action: any) => ipcRenderer.invoke('chatbot:executeAction', action),
    getStatus: () => ipcRenderer.invoke('chatbot:getStatus')
  },

  // MCP (Model Context Protocol) API
  mcp: {
    // Plugin Management
    getPlugins: () => ipcRenderer.invoke('mcp:getPlugins'),
    installPlugin: (pluginPath: string) => ipcRenderer.invoke('mcp:installPlugin', pluginPath),
    uninstallPlugin: (pluginId: string) => ipcRenderer.invoke('mcp:uninstallPlugin', pluginId),
    enablePlugin: (pluginId: string) => ipcRenderer.invoke('mcp:enablePlugin', pluginId),
    disablePlugin: (pluginId: string) => ipcRenderer.invoke('mcp:disablePlugin', pluginId),
    
    // Server Management
    getServers: () => ipcRenderer.invoke('mcp:getServers'),
    startServer: (serverId: string) => ipcRenderer.invoke('mcp:startServer', serverId),
    stopServer: (serverId: string) => ipcRenderer.invoke('mcp:stopServer', serverId),
    getServerStatus: (serverId: string) => ipcRenderer.invoke('mcp:getServerStatus', serverId),
    
    // Tool Execution
    callTool: (toolCall: any) => ipcRenderer.invoke('mcp:callTool', toolCall),
    
    // Resource Access
    getResource: (request: any) => ipcRenderer.invoke('mcp:getResource', request),
    
    // Prompt Templates
    getPrompt: (request: any) => ipcRenderer.invoke('mcp:getPrompt', request),
    
    // Configuration
    getConfig: () => ipcRenderer.invoke('mcp:getConfig'),
    updateConfig: (config: any) => ipcRenderer.invoke('mcp:updateConfig', config),
    
    // Plugin Discovery
    searchPlugins: (query: string) => ipcRenderer.invoke('mcp:searchPlugins', query),
    getPluginInfo: (pluginId: string) => ipcRenderer.invoke('mcp:getPluginInfo', pluginId),
    
    // Validation and Security
    validatePlugin: (pluginPath: string) => ipcRenderer.invoke('mcp:validatePlugin', pluginPath),
    
    // Development and Debugging
    getServerLogs: (serverId: string, lines?: number) => ipcRenderer.invoke('mcp:getServerLogs', serverId, lines),
    testServerConnection: (serverId: string) => ipcRenderer.invoke('mcp:testServerConnection', serverId),
    
    // Event Listeners
    onEvent: (callback: (event: any) => void) => {
      const handler = (_: any, event: any) => callback(event);
      ipcRenderer.on('mcp:event', handler);
      return () => ipcRenderer.removeListener('mcp:event', handler);
    }
  },

  // Configuration operations
  getEmailAccounts: () => ipcRenderer.invoke('config:getEmailAccounts'),
  saveEmailAccount: (config: any) => ipcRenderer.invoke('config:saveEmailAccount', config),
  updateEmailAccount: (accountId: string, updates: any) => ipcRenderer.invoke('config:updateEmailAccount', accountId, updates),
  deleteEmailAccount: (accountId: string) => ipcRenderer.invoke('config:deleteEmailAccount', accountId),
  testEmailConnection: (config: any) => ipcRenderer.invoke('config:testEmailConnection', config),
  getAIProviders: () => ipcRenderer.invoke('config:getAIProviders'),
  saveAIProvider: (provider: any) => ipcRenderer.invoke('config:saveAIProvider', provider),
  deleteAIProvider: (providerId: string) => ipcRenderer.invoke('config:deleteAIProvider', providerId),
  getAppSettings: () => ipcRenderer.invoke('config:getAppSettings'),
  updateAppSettings: (settings: any) => ipcRenderer.invoke('config:updateAppSettings', settings),
  importConfig: (configData: any) => ipcRenderer.invoke('config:import', configData),
  exportConfig: () => ipcRenderer.invoke('config:export'),

  // Application operations
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  getLogs: (options?: any) => ipcRenderer.invoke('app:getLogs', options),
  clearLogs: () => ipcRenderer.invoke('app:clearLogs'),
  logError: (error: any) => ipcRenderer.invoke('app:logError', error),
  restart: () => ipcRenderer.invoke('app:restart'),
  checkUpdates: () => ipcRenderer.invoke('app:checkUpdates'),

  // Event listeners
  onEmailReceived: (callback: (data: any) => void) => {
    ipcRenderer.on('new-emails', (_event, data) => callback(data))
  },
  onSyncStatusChanged: (callback: (status: any) => void) => {
    ipcRenderer.on('sync:statusChanged', (_event, status) => callback(status))
  },
  onServiceError: (callback: (error: any) => void) => {
    ipcRenderer.on('service-error', (_event, error) => callback(error))
  },
  onServiceStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('service-status', (_event, status) => callback(status))
  },
  onThemeChanged: (callback: (theme: any) => void) => {
    ipcRenderer.on('theme-changed', (_event, theme) => callback(theme))
  },
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      // Email operations
      addEmailAccount: (config: any) => Promise<any>
      removeEmailAccount: (accountId: string) => Promise<boolean>
      syncEmails: (accountId: string) => Promise<any>
      getEmails: (accountId: string, folderId?: string, limit?: number, offset?: number) => Promise<any[]>
      getEmail: (emailId: string) => Promise<any>
      getFolders: (accountId: string) => Promise<any[]>
      searchEmails: (query: any) => Promise<any>
      performEmailAction: (action: any) => Promise<any>

      // AI operations
      summarizeEmail: (email: any) => Promise<string>
      composeReply: (context: any) => Promise<string>
      categorizeEmail: (email: any) => Promise<any>
      generateDraft: (prompt: string, context?: any) => Promise<string>
      extractActionItems: (email: any) => Promise<any[]>
      getAIStatus: () => Promise<any>
      switchAIProvider: (providerId: string) => Promise<boolean>

      // Chatbot operations
      chatbot: {
        sendMessage: (request: any) => Promise<any>
        getConversations: () => Promise<any[]>
        deleteConversation: (conversationId: string) => Promise<void>
        updateConfig: (config: any) => Promise<void>
        getConfig: () => Promise<any>
        executeAction: (action: any) => Promise<void>
        getStatus: () => Promise<any>
      }

      // MCP (Model Context Protocol) API
      mcp: {
        // Plugin Management
        getPlugins: () => Promise<any[]>
        installPlugin: (pluginPath: string) => Promise<any>
        uninstallPlugin: (pluginId: string) => Promise<boolean>
        enablePlugin: (pluginId: string) => Promise<boolean>
        disablePlugin: (pluginId: string) => Promise<boolean>
        
        // Server Management
        getServers: () => Promise<any[]>
        startServer: (serverId: string) => Promise<boolean>
        stopServer: (serverId: string) => Promise<boolean>
        getServerStatus: (serverId: string) => Promise<any>
        
        // Tool Execution
        callTool: (toolCall: any) => Promise<any>
        
        // Resource Access
        getResource: (request: any) => Promise<any>
        
        // Prompt Templates
        getPrompt: (request: any) => Promise<any>
        
        // Configuration
        getConfig: () => Promise<any>
        updateConfig: (config: any) => Promise<void>
        
        // Plugin Discovery
        searchPlugins: (query: string) => Promise<any[]>
        getPluginInfo: (pluginId: string) => Promise<any>
        
        // Validation and Security
        validatePlugin: (pluginPath: string) => Promise<any>
        
        // Development and Debugging
        getServerLogs: (serverId: string, lines?: number) => Promise<string[]>
        testServerConnection: (serverId: string) => Promise<boolean>
        
        // Event Listeners
        onEvent: (callback: (event: any) => void) => () => void
      }

      // Configuration operations
      getEmailAccounts: () => Promise<any[]>
      saveEmailAccount: (config: any) => Promise<any>
      updateEmailAccount: (accountId: string, updates: any) => Promise<any>
      deleteEmailAccount: (accountId: string) => Promise<boolean>
      testEmailConnection: (config: any) => Promise<any>
      getAIProviders: () => Promise<any[]>
      saveAIProvider: (provider: any) => Promise<any>
      deleteAIProvider: (providerId: string) => Promise<boolean>
      getAppSettings: () => Promise<any>
      updateAppSettings: (settings: any) => Promise<any>
      importConfig: (configData: any) => Promise<boolean>
      exportConfig: () => Promise<any>

      // Application operations
      getAppInfo: () => Promise<any>
      getLogs: (options?: any) => Promise<any[]>
      clearLogs: () => Promise<boolean>
      logError: (error: any) => Promise<void>
      restart: () => Promise<void>
      checkUpdates: () => Promise<any>

      // Event listeners
      onEmailReceived: (callback: (data: any) => void) => void
      onSyncStatusChanged: (callback: (status: any) => void) => void
      onServiceError: (callback: (error: any) => void) => void
      onServiceStatus: (callback: (status: any) => void) => void
      onThemeChanged: (callback: (theme: any) => void) => void
    }
  }
}