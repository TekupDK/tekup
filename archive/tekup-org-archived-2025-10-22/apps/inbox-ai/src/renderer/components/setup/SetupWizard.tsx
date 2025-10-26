import React, { useState } from 'react'
import { EmailAccount, AIProvider } from '@shared/types'

interface SetupWizardProps {
  onAccountAdded: (account: EmailAccount) => void
  onSetupComplete: () => void
  aiProviders: AIProvider[]
}

type SetupStep = 'welcome' | 'email' | 'ai' | 'complete'

interface EmailFormData {
  provider: 'gmail' | 'outlook' | 'other'
  email: string
  password: string
  host?: string
  port?: number
  secure?: boolean
}

export function SetupWizard({ onAccountAdded, onSetupComplete, aiProviders }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome')
  const [emailData, setEmailData] = useState<EmailFormData>({
    provider: 'gmail',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Test connection first
      const testResult = await window.electronAPI.testEmailConnection({
        username: emailData.email,
        password: emailData.password,
        host: getHostForProvider(emailData.provider, emailData.host),
        port: getPortForProvider(emailData.provider, emailData.port),
        secure: emailData.secure ?? true,
        provider: emailData.provider
      })

      if (testResult.success) {
        // Save the account
        const account = await window.electronAPI.saveEmailAccount({
          username: emailData.email,
          password: emailData.password,
          host: getHostForProvider(emailData.provider, emailData.host),
          port: getPortForProvider(emailData.provider, emailData.port),
          secure: emailData.secure ?? true,
          provider: emailData.provider
        })

        onAccountAdded(account)
        setCurrentStep('ai')
      } else {
        setError(testResult.error || 'Failed to connect to email server')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add email account')
    } finally {
      setIsLoading(false)
    }
  }

  const getHostForProvider = (provider: string, customHost?: string) => {
    if (customHost) return customHost
    switch (provider) {
      case 'gmail': return 'imap.gmail.com'
      case 'outlook': return 'outlook.office365.com'
      default: return ''
    }
  }

  const getPortForProvider = (provider: string, customPort?: number) => {
    if (customPort) return customPort
    return 993 // Default IMAP SSL port
  }

  const renderWelcomeStep = () => (
    <div className="text-center">
      <div className="mx-auto mb-8">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to AI IMAP Inbox
      </h1>
      
      <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
        Let's get you set up with your email accounts and AI-powered features.
      </p>
      
      <button
        onClick={() => setCurrentStep('email')}
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Get Started
      </button>
    </div>
  )

  const renderEmailStep = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Add Your Email Account
      </h2>
      
      <form onSubmit={handleEmailSubmit} className="space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Provider
          </label>
          <select
            value={emailData.provider}
            onChange={(e) => setEmailData(prev => ({ 
              ...prev, 
              provider: e.target.value as EmailFormData['provider']
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="gmail">Gmail</option>
            <option value="outlook">Outlook/Hotmail</option>
            <option value="other">Other IMAP Provider</option>
          </select>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            required
            value={emailData.email}
            onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="your.email@example.com"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            required
            value={emailData.password}
            onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your email password or app password"
          />
        </div>

        {/* Custom server settings for 'other' provider */}
        {emailData.provider === 'other' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IMAP Server
              </label>
              <input
                type="text"
                required
                value={emailData.host || ''}
                onChange={(e) => setEmailData(prev => ({ ...prev, host: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="imap.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port
              </label>
              <input
                type="number"
                value={emailData.port || 993}
                onChange={(e) => setEmailData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep('welcome')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Testing Connection...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </form>
    </div>
  )

  const renderAIStep = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        AI Features (Optional)
      </h2>
      
      <p className="text-gray-600 mb-8">
        You can configure AI providers later in settings to enable smart features like email summarization and composition assistance.
      </p>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setCurrentStep('complete')}
          className="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Skip for Now
        </button>
        
        <button
          onClick={onSetupComplete}
          className="px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Complete Setup
        </button>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="text-center">
      <div className="mx-auto mb-8">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Setup Complete!
      </h2>
      
      <p className="text-gray-600 mb-8">
        Your email account has been configured successfully. You can now start using AI IMAP Inbox.
      </p>
      
      <button
        onClick={onSetupComplete}
        className="px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Start Using the App
      </button>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome': return renderWelcomeStep()
      case 'email': return renderEmailStep()
      case 'ai': return renderAIStep()
      case 'complete': return renderCompleteStep()
      default: return renderWelcomeStep()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2">
            {['welcome', 'email', 'ai', 'complete'].map((step, index) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full ${
                  currentStep === step
                    ? 'bg-blue-600'
                    : index < ['welcome', 'email', 'ai', 'complete'].indexOf(currentStep)
                    ? 'bg-blue-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        
        {renderCurrentStep()}
      </div>
    </div>
  )
}