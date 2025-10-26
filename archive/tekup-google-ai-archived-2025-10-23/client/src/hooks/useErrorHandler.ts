import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface ErrorState {
  error: Error | null
  isError: boolean
  errorMessage: string
}

interface UseErrorHandlerReturn extends ErrorState {
  handleError: (error: Error | string, showToast?: boolean) => void
  clearError: () => void
  retryAction: (action: () => Promise<void> | void) => Promise<void>
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorMessage: ''
  })

  const handleError = useCallback((error: Error | string, showToast = true) => {
    const errorObj = error instanceof Error ? error : new Error(error)
    const message = errorObj.message || 'Der opstod en uventet fejl'

    setErrorState({
      error: errorObj,
      isError: true,
      errorMessage: message
    })

    // Log error for debugging
    console.error('Error handled:', errorObj)

    // Show toast notification if requested
    if (showToast) {
      toast.error(message, {
        description: 'Prøv venligst igen eller kontakt support hvis problemet fortsætter.',
        action: {
          label: 'Luk',
          onClick: () => {}
        }
      })
    }

    // You can integrate with error reporting services here
    // Example: Sentry.captureException(errorObj)
  }, [])

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorMessage: ''
    })
  }, [])

  const retryAction = useCallback(async (action: () => Promise<void> | void) => {
    try {
      clearError()
      await action()
    } catch (error) {
      handleError(error as Error)
    }
  }, [handleError, clearError])

  return {
    ...errorState,
    handleError,
    clearError,
    retryAction
  }
}

// Specific error handlers for common scenarios
export function useApiErrorHandler() {
  const { handleError, ...rest } = useErrorHandler()

  const handleApiError = useCallback((error: any) => {
    let message = 'Der opstod en fejl ved kommunikation med serveren'

    if (error?.response?.status) {
      switch (error.response.status) {
        case 400:
          message = 'Ugyldig anmodning. Kontroller venligst dine data.'
          break
        case 401:
          message = 'Du er ikke autoriseret. Log venligst ind igen.'
          break
        case 403:
          message = 'Du har ikke tilladelse til at udføre denne handling.'
          break
        case 404:
          message = 'Den ønskede ressource blev ikke fundet.'
          break
        case 429:
          message = 'For mange anmodninger. Prøv venligst igen senere.'
          break
        case 500:
          message = 'Serverfejl. Prøv venligst igen senere.'
          break
        case 503:
          message = 'Tjenesten er midlertidigt utilgængelig.'
          break
        default:
          message = `Serverfejl (${error.response.status}). Prøv venligst igen.`
      }
    } else if (error?.code === 'NETWORK_ERROR') {
      message = 'Netværksfejl. Kontroller din internetforbindelse.'
    } else if (error?.message) {
      message = error.message
    }

    handleError(new Error(message))
  }, [handleError])

  return {
    ...rest,
    handleError: handleApiError,
    handleApiError
  }
}

// Hook for handling async operations with loading and error states
export function useAsyncOperation<T = any>() {
  const [isLoading, setIsLoading] = useState(false)
  const { handleError, clearError, isError, errorMessage } = useErrorHandler()

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
      showSuccessToast?: boolean
      successMessage?: string
    }
  ): Promise<T | null> => {
    try {
      setIsLoading(true)
      clearError()

      const result = await operation()

      if (options?.onSuccess) {
        options.onSuccess(result)
      }

      if (options?.showSuccessToast && options?.successMessage) {
        toast.success(options.successMessage)
      }

      return result
    } catch (error) {
      const errorObj = error as Error
      handleError(errorObj)
      
      if (options?.onError) {
        options.onError(errorObj)
      }

      return null
    } finally {
      setIsLoading(false)
    }
  }, [handleError, clearError])

  return {
    execute,
    isLoading,
    isError,
    errorMessage,
    clearError
  }
}