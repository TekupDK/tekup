import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

// Provide a minimal mock for window.electronAPI so App can initialize
declare global {
  interface Window {
    electronAPI: any
  }
}

beforeEach(() => {
  (window as any).electronAPI = {
    getAppInfo: jest.fn().mockResolvedValue({ version: '1.0.0' }),
    getEmailAccounts: jest.fn().mockResolvedValue([
      { id: 'acc1', email: 'test@example.com', name: 'Test', provider: 'gmail', isDefault: true },
    ]),
    getAIProviders: jest.fn().mockResolvedValue([
      { id: 'openai', name: 'OpenAI', isDefault: true },
    ]),
    getAppSettings: jest.fn().mockResolvedValue(null),
  }
})

test('renders AI IMAP Inbox title after initialization', async () => {
  render(<App />)
  // Wait for the Sidebar title to appear once initialization completes
  const titleElement = await screen.findByText(/AI IMAP Inbox/i)
  expect(titleElement).toBeInTheDocument()
})

test('renders Compose button in the main shell', async () => {
  render(<App />)
  await waitFor(() => expect(screen.getByText(/AI IMAP Inbox/i)).toBeInTheDocument())
  const composeBtn = screen.getByText(/Compose/i)
  expect(composeBtn).toBeInTheDocument()
})