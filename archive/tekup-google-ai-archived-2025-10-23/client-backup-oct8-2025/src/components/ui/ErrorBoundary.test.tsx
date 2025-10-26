import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ErrorBoundary, ErrorFallback, useErrorHandler } from './ErrorBoundary'
import { reportError } from '../../lib/sentry'

// Mock ErrorFeedback component
vi.mock('./ErrorFeedback', () => ({
  ErrorFeedback: ({ error, errorInfo }: any) => (
    <div data-testid="error-feedback">Error Feedback Component</div>
  )
}))

// Mock Sentry
vi.mock('../../lib/sentry', () => ({
  reportError: vi.fn()
}))

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
  vi.clearAllMocks()
})

afterEach(() => {
  console.error = originalConsoleError
})

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Noget gik galt')).toBeInTheDocument()
    expect(screen.getByText('Der opstod en uventet fejl. Vi beklager ulejligheden.')).toBeInTheDocument()
    expect(screen.getByTestId('error-feedback')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Noget gik galt')).not.toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('reports error to Sentry when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(reportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        errorBoundary: true,
        componentStack: expect.any(String),
        errorInfo: expect.any(Object)
      })
    )
  })

  it('shows error details in development mode', () => {
    // Mock development environment
    const originalEnv = import.meta.env.DEV
    vi.stubEnv('DEV', 'true')

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Fejldetaljer (kun udvikling)')).toBeInTheDocument()

    // Restore original environment
    vi.unstubAllEnvs()
  })

  it.skip('handles reset button click', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true)
      
      return (
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
          <button onClick={() => setShouldThrow(false)}>Reset Component</button>
        </ErrorBoundary>
      )
    }

    render(<TestComponent />)

    expect(screen.getByText('Noget gik galt')).toBeInTheDocument()

    // Click reset button
    fireEvent.click(screen.getByText('Prøv igen'))

    // The ErrorBoundary should reset its state, but we need to trigger a re-render
    // by changing the component that was throwing the error
    fireEvent.click(screen.getByText('Reset Component'))

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it.skip('handles reload button click', () => {
    // Mock window.location.reload
    const mockReload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload: mockReload })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // The error boundary should render the error UI
    expect(screen.getByText('Noget gik galt')).toBeInTheDocument()

    // Find and click the reload button
    const reloadButton = screen.getByText('Genindlæs siden')
    fireEvent.click(reloadButton)

    expect(mockReload).toHaveBeenCalled()
  })

  it.skip('handles go home button click', () => {
    // Mock window.location.href
    const mockLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByText('Gå til forsiden'))
    expect(mockLocation.href).toBe('/')
  })
})

describe('ErrorFallback', () => {
  it('renders error message and reset button', () => {
    const error = new Error('Test error message')
    const resetError = vi.fn()

    render(<ErrorFallback error={error} resetError={resetError} />)

    expect(screen.getByText('Der opstod en fejl')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByText('Prøv igen')).toBeInTheDocument()
  })

  it('calls resetError when reset button is clicked', () => {
    const error = new Error('Test error')
    const resetError = vi.fn()

    render(<ErrorFallback error={error} resetError={resetError} />)

    fireEvent.click(screen.getByText('Prøv igen'))
    expect(resetError).toHaveBeenCalled()
  })
})

describe('useErrorHandler', () => {
  it('reports errors to Sentry and console', () => {
    const errorHandler = useErrorHandler()
    const testError = new Error('Test error')
    const errorInfo = { componentStack: 'test stack' }

    errorHandler(testError, errorInfo)

    expect(console.error).toHaveBeenCalledWith('Error caught by error handler:', testError, errorInfo)
    expect(reportError).toHaveBeenCalledWith(testError, {
      errorHandler: true,
      errorInfo: errorInfo
    })
  })
})