'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

interface StripeContextType {
  stripe: Stripe | null;
  isLoading: boolean;
  error: string | null;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

interface StripeProviderProps {
  children: React.ReactNode;
  publishableKey?: string;
}

export function StripeProvider({ children, publishableKey }: StripeProviderProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        // Use provided key or environment variable
        const key = publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        
        if (!key) {
          throw new Error('Stripe publishable key not found');
        }

        const stripeInstance = await loadStripe(key);
        
        if (!stripeInstance) {
          throw new Error('Failed to initialize Stripe');
        }

        setStripe(stripeInstance);
      } catch (err) {
        console.error('Stripe initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Stripe');
      } finally {
        setIsLoading(false);
      }
    };

    initializeStripe();
  }, [publishableKey]);

  return (
    <StripeContext.Provider value={{ stripe, isLoading, error }}>
      {children}
    </StripeContext.Provider>
  );
}

export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}