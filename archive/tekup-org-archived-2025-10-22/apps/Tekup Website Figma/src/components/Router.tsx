'use client';

import { AboutPage } from './AboutPage';
import { BlogPage } from './BlogPage';
import { DocsPage } from './DocsPage';
import { Dashboard } from './Dashboard';
import { ContactPage } from './ContactPage';
import { TenantSettings } from './TenantSettings';
import { AutomationControlPanel } from './AutomationControlPanel';
import { AdminPage } from './AdminPage';
import { SchedulingPage } from './SchedulingPage';

// Main landing page components
import { HeroSection } from './HeroSection';
import { ProductSection } from './ProductSection';
import { PricingSection } from './PricingSection';
import { SecuritySection } from './SecuritySection';
import { TestimonialsSection } from './TestimonialsSection';
import { SolutionsSection } from './SolutionsSection';
import { FeaturesSection } from './FeaturesSection';
import { IntegrationsSection } from './IntegrationsSection';
import { TrustSignalsSection } from './TrustSignalsSection';
import { FaqSection } from './FaqSection';
import { NewsletterCTASection } from './NewsletterCTASection';
import { NotFoundPage } from './NotFoundPage';

export type Route = 'home' | 'about' | 'blog' | 'docs' | 'dashboard' | 'contact' | 'pricing' | 'solutions' | 'admin' | 'tenant-settings' | 'automation' | 'scheduling';

interface RouterProps {
  currentRoute: Route;
}

export function Router({ currentRoute }: RouterProps) {
  switch (currentRoute) {
    case 'about':
      return <AboutPage />;
    
    case 'blog':
      return <BlogPage />;
    
    case 'docs':
      return <DocsPage />;
    
    case 'dashboard':
      return <Dashboard />;
    
    case 'contact':
      return <ContactPage />;
    
    case 'pricing':
      return <PricingPage />;
    
    case 'solutions':
      return <SolutionsPage />;
    
    case 'admin':
      return <AdminPage />;
    
    case 'tenant-settings':
      return (
        <div className="pt-20 min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <TenantSettings />
          </div>
        </div>
      );
    
    case 'automation':
      return (
        <div className="pt-20 min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AutomationControlPanel />
          </div>
        </div>
      );
    
    case 'scheduling':
      return <SchedulingPage />;    
    case 'home':
    default:
      return (
        <div>
          <HeroSection />
          <div id="products">
            <ProductSection />
          </div>
          <FeaturesSection />
          <div id="solutions">
            <SolutionsSection />
          </div>
          <IntegrationsSection />
          <TestimonialsSection />
          <div id="pricing">
            <PricingSection />
          </div>
          <TrustSignalsSection />
          <div id="security">
            <SecuritySection />
          </div>
          <FaqSection />
          <NewsletterCTASection />
        </div>
      );
  }
}

// Individual page components for specific routes
function PricingPage() {
  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <PricingSection />
    </div>
  );
}

function SolutionsPage() {
  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <SolutionsSection />
    </div>
  );
}