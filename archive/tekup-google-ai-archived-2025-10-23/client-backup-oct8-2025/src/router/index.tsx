import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

const router = createBrowserRouter(routes);

export function AppRouter() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
