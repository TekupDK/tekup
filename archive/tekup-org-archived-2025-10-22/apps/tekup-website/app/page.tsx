import { Suspense } from "react";
import { HeroSection } from "@/components/sections/HeroSection";
import { Navigation } from "@/components/layout/Navigation";
import { TrustSection } from "@/components/sections/TrustSection";
import { ProblemSolutionSection } from "@/components/sections/ProblemSolutionSection";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { Footer } from "@/components/layout/Footer";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function HomePage() {
  return (
    <>
      {/* Skip to main content for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary-600 text-white rounded-md focus-ring"
      >
        Spring til hovedindhold
      </a>
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main content */}
      <main id="main" className="relative">
        {/* Hero Section with 3D animations */}
        <Suspense fallback={<LoadingSkeleton className="h-screen" />}>
          <HeroSection />
        </Suspense>
        
        {/* Trust indicators */}
        <Suspense fallback={<LoadingSkeleton className="h-32" />}>
          <TrustSection />
        </Suspense>
        
        {/* Problem → Solution */}
        <Suspense fallback={<LoadingSkeleton className="h-96" />}>
          <ProblemSolutionSection />
        </Suspense>
        
        {/* Product showcase with GSAP animations */}
        <Suspense fallback={<LoadingSkeleton className="h-screen" />}>
          <ProductShowcase />
        </Suspense>
        
        {/* Customer testimonials carousel */}
        <Suspense fallback={<LoadingSkeleton className="h-96" />}>
          <TestimonialsSection />
        </Suspense>
        
        {/* Contact form with Flow API integration */}
        <Suspense fallback={<LoadingSkeleton className="h-96" />}>
          <ContactSection />
        </Suspense>
      </main>
      
      {/* Footer */}
      <Footer />
    </>
  );
}
