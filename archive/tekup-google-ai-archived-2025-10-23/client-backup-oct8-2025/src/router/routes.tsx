import { lazy, Suspense } from 'react';
import { RouteConfig } from './types';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import NotFound from '../components/NotFound';

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy-load all pages for code splitting
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Customers = lazy(() => import('../pages/Customers/Customers'));
const Leads = lazy(() => import('../pages/Leads/Leads'));
const Bookings = lazy(() => import('../pages/Bookings/Bookings'));
const Quotes = lazy(() => import('../pages/Quotes/Quotes'));
const Analytics = lazy(() => import('../pages/Analytics/Analytics'));
const Settings = lazy(() => import('../pages/Settings/Settings'));
const Services = lazy(() => import('../pages/Services/Services'));
const CleaningPlans = lazy(() => import('../pages/CleaningPlans'));
const ChatInterface = lazy(() => import('../components/ChatInterface'));
const Customer360 = lazy(() => import('../components/Customer360'));
const EmailApproval = lazy(() => import('../components/EmailApproval'));
const CalendarView = lazy(() => import('../components/Calendar'));
const Terms = lazy(() => import('../pages/Legal/Terms'));
const Privacy = lazy(() => import('../pages/Legal/Privacy'));

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: <Layout />,
    title: 'RenOS Dashboard',
    children: [
      {
        path: '',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          </ErrorBoundary>
        ),
        title: 'Dashboard',
        protected: true
      },
      {
        path: 'chat',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ChatInterface />
          </Suspense>
        ),
        title: 'AI Chat',
        protected: true
      },
      {
        path: 'customers',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Customers />
          </Suspense>
        ),
        title: 'Kunder',
        protected: true
      },
      {
        path: 'customer360',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Customer360 />
          </Suspense>
        ),
        title: 'Customer 360',
        protected: true
      },
      {
        path: 'leads',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Leads />
            </Suspense>
          </ErrorBoundary>
        ),
        title: 'Leads',
        protected: true
      },
      {
        path: 'email-approval',
        element: (
          <Suspense fallback={<PageLoader />}>
            <EmailApproval />
          </Suspense>
        ),
        title: 'Email Godkendelse',
        protected: true
      },
      {
        path: 'bookings',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Bookings />
            </Suspense>
          </ErrorBoundary>
        ),
        title: 'Bookinger',
        protected: true
      },
      {
        path: 'calendar',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <CalendarView />
            </Suspense>
          </ErrorBoundary>
        ),
        title: 'Kalender',
        protected: true
      },
      {
        path: 'quotes',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Quotes />
          </Suspense>
        ),
        title: 'Tilbud',
        protected: true
      },
      {
        path: 'analytics',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Analytics />
            </Suspense>
          </ErrorBoundary>
        ),
        title: 'Analytics',
        protected: true
      },
      {
        path: 'services',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Services />
          </Suspense>
        ),
        title: 'Services',
        protected: true
      },
      {
        path: 'cleaning-plans',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CleaningPlans />
          </Suspense>
        ),
        title: 'Rengøringsplaner',
        protected: true
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Settings />
          </Suspense>
        ),
        title: 'Indstillinger',
        protected: true
      },
      {
        path: 'vilkaar',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Terms />
          </Suspense>
        ),
        title: 'Vilkår og Betingelser',
        protected: false
      },
      {
        path: 'privatlivspolitik',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Privacy />
          </Suspense>
        ),
        title: 'Privatlivspolitik',
        protected: false
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />,
    title: 'Side ikke fundet'
  }
];
