import { useState, useCallback } from 'react';

interface UseAsyncOperationOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    showSuccessToast?: boolean;
}

export function useAsyncOperation() {
    const [isLoading, setIsLoading] = useState(false);

    const execute = useCallback(
        async <T>(
            operation: () => Promise<T>,
            options?: UseAsyncOperationOptions
        ): Promise<T | undefined> => {
            setIsLoading(true);
            try {
                const result = await operation();
                options?.onSuccess?.();
                return result;
            } catch (error) {
                options?.onError?.(error as Error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    return { execute, isLoading };
}
