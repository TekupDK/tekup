// Jest setup file for testing configuration
import '@testing-library/jest-dom'

// Mock Electron APIs for testing
global.window.electronAPI = {
  // Email operations
  addEmailAccount: jest.fn(),
  removeEmailAccount: jest.fn(),
  syncEmails: jest.fn(),
  searchEmails: jest.fn(),
  performEmailAction: jest.fn(),

  // AI operations
  summarizeEmail: jest.fn(),
  composeReply: jest.fn(),
  categorizeEmail: jest.fn(),
  generateDraft: jest.fn(),

  // Configuration operations
  getEmailAccounts: jest.fn(),
  saveEmailAccount: jest.fn(),
  getAIProviders: jest.fn(),
  saveAIProvider: jest.fn(),
  getAppSettings: jest.fn(),
  updateAppSettings: jest.fn(),

  // Event listeners
  onEmailReceived: jest.fn(),
  onSyncStatusChanged: jest.fn(),
}