import { useState } from "react";

import Navigation from "./Navigation";
import HeroSection from "./HeroSection";
import EcosystemShowcase from "./EcosystemShowcase";
import ServicesGrid from "./ServicesGrid";
import IntegrationsSection from "./IntegrationsSection";
import TestimonialsSection from "./TestimonialsSection";
import ContactSection from "./ContactSection";
import Footer from "./Footer";
import FloatingChat from "./FloatingChat";
import LoadingScreen from "./LoadingScreen";

const TekUpLanding = () => {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <EcosystemShowcase />
        <ServicesGrid />
        <IntegrationsSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
      <FloatingChat />
    </div>
  );
};

export default TekUpLanding;