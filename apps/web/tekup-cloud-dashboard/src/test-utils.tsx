import { ReactElement } from 'react';
import { ThemeProvider } from './contexts/ThemeProvider';
import { AppProvider } from './contexts/AppProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function withProviders(ui: ReactElement) {
  const client = new QueryClient();
  return (
    <ThemeProvider>
      <AppProvider>
        <QueryClientProvider client={client}>{ui}</QueryClientProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

