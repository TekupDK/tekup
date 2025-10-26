"use client"

import Link from "next/link"
import { trackEvent } from "@/components/Analytics"

export function HeroSection() {
  const handleCTAClick = (ctaType: string) => {
    trackEvent('cta_clicked', { 
      section: 'hero', 
      type: ctaType,
      timestamp: Date.now() 
    })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 mesh-gradient opacity-20 animate-gradient-shift" />
      
      {/* Floating shapes (placeholder for 3D elements) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-primary-400/20 to-accent-400/20 backdrop-blur-sm animate-float" />
        <div className="absolute top-40 right-20 w-20 h-20 rounded-lg bg-gradient-to-br from-accent-400/20 to-primary-400/20 backdrop-blur-sm animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-32 left-1/3 w-16 h-16 rounded-full bg-gradient-to-br from-primary-300/30 to-accent-300/30 backdrop-blur-sm animate-float" style={{ animationDelay: "2s" }} />
      </div>
      
      {/* Hero content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display mb-6">
            <span className="gradient-text">
              Bliv Copilot Ready og NIS2-klar
            </span>
            <br />
            <span className="text-gray-700">
              – uden at drukne i dokumentation
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            TekUp samler NIS2, AI-sikkerhed og Microsoft 365-governance ét sted 
            – med konkrete anbefalinger og dokumentérbar efterlevelse.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/kontakt"
              onClick={() => handleCTAClick('book_demo')}
              className="btn-premium text-white px-8 py-4 text-lg font-semibold"
            >
              Book en demo
            </Link>
            <Link
              href="#product-showcase"
              onClick={() => handleCTAClick('see_platform')}
              className="px-8 py-4 text-lg font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-300"
            >
              Se platformen
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Betroet af danske SMV&apos;er inden for
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-gray-400">
              <span>Finans</span>
              <span>•</span>
              <span>Produktion</span>
              <span>•</span>
              <span>Rådgivning</span>
              <span>•</span>
              <span>IT Services</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  )
}