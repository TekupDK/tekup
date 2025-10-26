"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Privacy-compliant analytics implementation
      // You can integrate with Plausible, Fathom, or similar privacy-focused analytics
      
      // Example for Google Analytics 4 (optional, commented out for privacy)
      /*
      if (process.env.NEXT_PUBLIC_GA_ID) {
        gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
          page_path: pathname
        })
      }
      */

      // Example for Plausible Analytics (recommended for privacy)
      if (process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) {
        // Plausible automatically tracks page views
        console.log(`Page view: ${pathname}`)
      }

      // Custom analytics events for conversion tracking
      if (pathname === '/') {
        trackEvent('page_view', { page: 'homepage' })
      } else if (pathname === '/contact') {
        trackEvent('page_view', { page: 'contact' })
      }
    }
  }, [pathname])

  return null
}

// Custom event tracking function
export function trackEvent(eventName: string, eventData?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    // Send events to your analytics service
    console.log(`Event: ${eventName}`, eventData)
    
    // Example for custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_URL) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          data: eventData,
          timestamp: Date.now(),
          pathname: window.location.pathname,
        }),
      }).catch(() => {
        // Silently fail - don't let analytics break the site
      })
    }
  }
}