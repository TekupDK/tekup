'use client';

import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  schema?: object;
}

export function SEOHead({
  title = "Tekup - AI-drevet CRM til rengøringsbranchen",
  description = "Automatiser din rengøringsvirksomhed med Tekup's AI-drevne CRM. Lead scoring, kundestyring og Jarvis AI automatisering. Prøv gratis i dag.",
  keywords = ["rengøring", "CRM", "AI", "lead scoring", "kundestyring", "automatisering", "rengøringsvirksomhed", "Danmark"],
  image = "/images/tekup-og-image.jpg",
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author = "Tekup",
  schema
}: SEOHeadProps) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Set meta description
    updateMetaTag('description', description);
    
    // Set meta keywords
    updateMetaTag('keywords', keywords.join(', '));
    
    // Open Graph tags
    updateMetaProperty('og:title', title);
    updateMetaProperty('og:description', description);
    updateMetaProperty('og:image', image);
    updateMetaProperty('og:type', type);
    updateMetaProperty('og:locale', 'da_DK');
    updateMetaProperty('og:site_name', 'Tekup');
    
    if (url) {
      updateMetaProperty('og:url', url);
    }
    
    // Twitter Card tags
    updateMetaName('twitter:card', 'summary_large_image');
    updateMetaName('twitter:title', title);
    updateMetaName('twitter:description', description);
    updateMetaName('twitter:image', image);
    updateMetaName('twitter:site', '@TekupDK');
    updateMetaName('twitter:creator', '@TekupDK');
    
    // Article specific meta tags
    if (type === 'article') {
      if (publishedTime) {
        updateMetaProperty('article:published_time', publishedTime);
      }
      if (modifiedTime) {
        updateMetaProperty('article:modified_time', modifiedTime);
      }
      if (author) {
        updateMetaProperty('article:author', author);
      }
      updateMetaProperty('article:section', 'Rengøring');
      keywords.forEach(keyword => {
        updateMetaProperty('article:tag', keyword);
      });
    }
    
    // Additional SEO meta tags
    updateMetaName('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMetaName('googlebot', 'index, follow');
    updateMetaName('bingbot', 'index, follow');
    updateMetaName('language', 'Danish');
    updateMetaName('geo.region', 'DK');
    updateMetaName('geo.placename', 'Danmark');
    
    // Business specific meta tags
    updateMetaName('business:contact_data:locality', 'Danmark');
    updateMetaName('business:contact_data:region', 'Danmark');
    updateMetaName('business:contact_data:country_name', 'Danmark');
    
    // Structured data for local business
    const defaultSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Tekup",
      "description": description,
      "url": "https://tekup.dk",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "DKK",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock"
      },
      "creator": {
        "@type": "Organization",
        "name": "Tekup",
        "url": "https://tekup.dk",
        "logo": "https://tekup.dk/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+45-70-20-30-40",
          "contactType": "customer service",
          "availableLanguage": "Danish"
        }
      },
      "featureList": [
        "AI-drevet lead scoring",
        "CRM kundestyring", 
        "Automatisk lead kvalificering",
        "Jarvis AI assistent",
        "Real-time analytics",
        "Email integration"
      ],
      "audience": {
        "@type": "BusinessAudience",
        "businessFunction": "Rengøringsvirksomheder"
      }
    };
    
    updateStructuredData(schema || defaultSchema);
    
  }, [title, description, keywords, image, url, type, publishedTime, modifiedTime, author, schema]);

  return null; // This component doesn't render anything
}

// Helper functions
function updateMetaTag(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function updateMetaProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function updateMetaName(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function updateStructuredData(schema: object) {
  let script = document.querySelector('script[type="application/ld+json"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
}

// SEO utility hooks
export function useSEO() {
  const updateSEO = (seoData: SEOHeadProps) => {
    // This would trigger a re-render of SEOHead with new data
    // In a real app, you might use a context or state management
  };

  return { updateSEO };
}

// Page-specific SEO configurations
export const seoConfigs = {
  home: {
    title: "Tekup - AI-drevet CRM til rengøringsbranchen | Automatiser din virksomhed",
    description: "Automatiser din rengøringsvirksomhed med Tekup's AI-drevne CRM. Lead scoring, kundestyring og Jarvis AI automatisering. Prøv gratis i dag.",
    keywords: ["rengøring CRM", "AI lead scoring", "rengøringsvirksomhed", "automatisering", "Danmark", "kundestyring"]
  },
  pricing: {
    title: "Priser - Tekup CRM til rengøringsbranchen | Fra 299 kr/md",
    description: "Se Tekup's priser for AI-drevet CRM til rengøringsvirksomheder. Starter fra 299 kr/måned. Ingen binding, 14 dages gratis prøveperiode.",
    keywords: ["tekup priser", "CRM pris", "rengøring software pris", "AI CRM Danmark"]
  },
  dashboard: {
    title: "Dashboard - Tekup CRM | Live lead tracking og analytics",
    description: "Tekup dashboard med real-time lead tracking, AI scoring og performance analytics for din rengøringsvirksomhed.",
    keywords: ["CRM dashboard", "lead tracking", "analytics", "rengøring"],
    type: "product" as const
  },
  blog: {
    title: "Blog - Tekup | Tips til rengøringsvirksomheder og CRM",
    description: "Læs eksperttips om kundestyring, lead generering og automatisering af rengøringsvirksomheder med AI og CRM.",
    keywords: ["rengøring tips", "CRM guide", "lead generering", "virksomhed automatisering"]
  },
  contact: {
    title: "Kontakt Tekup | Support og salg | +45 70 20 30 40",
    description: "Kontakt Tekup for support, demo eller spørgsmål om vores AI-drevne CRM til rengøringsvirksomheder. Ring på +45 70 20 30 40.",
    keywords: ["tekup kontakt", "CRM support", "demo booking", "salg"]
  }
};