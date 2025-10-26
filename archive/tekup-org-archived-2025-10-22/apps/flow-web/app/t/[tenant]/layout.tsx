import React from 'react';
import { getApiBase, getDevTenantKey } from '../../../lib/config';
import TenantNavigation from './components/TenantNavigation';
import { TenantProvider } from './tenant-context';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

async function fetchSettings(tenant: string) {
  try {
  const key = getDevTenantKey();
  const api = getApiBase();
    if (!api || !key) return {} as any; // no branding in static demo w/out key
    const res = await fetch(`${api}/settings`, { headers: { 'x-tenant-key': key }, next: { revalidate: 30 } });
    if (!res.ok) return {} as any;
    const data = await res.json();
    return data.settings || {};
  } catch { return {} as any; }
}

export async function generateMetadata({ params }: { params: { tenant: string } }): Promise<Metadata> {
  const settings = await fetchSettings(params.tenant);
  const brandName = settings.brand_display_name || 'TekUp Flow';
  const themeColor = settings.theme_primary_color || '#2563eb';
  
  return {
    title: {
      template: `%s - ${brandName}`,
      default: brandName,
    },
    description: `${brandName} lead management platform`,
    themeColor: themeColor,
    icons: {
      icon: '/favicon.ico',
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
    },
    other: {
      'brand-color': themeColor,
    },
  };
}

export default async function TenantLayout({ children, params }: { children: React.ReactNode; params: { tenant: string } }) {
  const allowedTenants = ['rendetalje', 'foodtruck', 'tekup'];
  if (!allowedTenants.includes(params.tenant)) {
    notFound();
  }
  
  const settings = await fetchSettings(params.tenant);
  const brandName = settings.brand_display_name || 'TekUp Flow';
  const primary = settings.theme_primary_color || '#2563eb'; // Tailwind blue-600
  
  // Convert hex to RGB for better CSS custom property integration
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '37, 99, 235'; // fallback to blue-600 RGB
  };
  
  const primaryRgb = hexToRgb(primary);

  return (
    <div className="min-h-screen flex flex-col" style={{ 
      ['--px-primary' as any]: primary,
      ['--px-primary-rgb' as any]: primaryRgb 
    }}>
      <style jsx>{`
        :root { 
          --px-primary: ${primary}; 
          --px-primary-rgb: ${primaryRgb};
        }
        
        /* Brand color utilities */
        .text-brand { color: var(--px-primary); }
        .bg-brand { background-color: var(--px-primary); }
        .border-brand { border-color: var(--px-primary); }
        
        /* Brand color with opacity using RGB */
        .bg-brand\\/5 { background-color: rgba(var(--px-primary-rgb), 0.05); }
        .bg-brand\\/10 { background-color: rgba(var(--px-primary-rgb), 0.1); }
        .bg-brand\\/20 { background-color: rgba(var(--px-primary-rgb), 0.2); }
        .bg-brand\\/30 { background-color: rgba(var(--px-primary-rgb), 0.3); }
        .bg-brand\\/50 { background-color: rgba(var(--px-primary-rgb), 0.5); }
        .bg-brand\\/80 { background-color: rgba(var(--px-primary-rgb), 0.8); }
        .bg-brand\\/90 { background-color: rgba(var(--px-primary-rgb), 0.9); }
        
        .border-brand\\/20 { border-color: rgba(var(--px-primary-rgb), 0.2); }
        .border-brand\\/30 { border-color: rgba(var(--px-primary-rgb), 0.3); }
        .border-brand\\/50 { border-color: rgba(var(--px-primary-rgb), 0.5); }
        
        .text-brand\\/70 { color: rgba(var(--px-primary-rgb), 0.7); }
        .text-brand\\/80 { color: rgba(var(--px-primary-rgb), 0.8); }
        .text-brand\\/90 { color: rgba(var(--px-primary-rgb), 0.9); }
        
        /* Interactive states */
        .hover\\:bg-brand\\/10:hover { background-color: rgba(var(--px-primary-rgb), 0.1); }
        .hover\\:bg-brand\\/90:hover { background-color: rgba(var(--px-primary-rgb), 0.9); }
        .hover\\:border-brand:hover { border-color: var(--px-primary); }
        .hover\\:text-brand:hover { color: var(--px-primary); }
        
        .active\\:bg-brand\\/80:active { background-color: rgba(var(--px-primary-rgb), 0.8); }
        .focus\\:border-brand:focus { border-color: var(--px-primary); }
        .focus\\:ring-brand:focus { --tw-ring-color: var(--px-primary); }
        
        .disabled\\:bg-brand\\/50:disabled { background-color: rgba(var(--px-primary-rgb), 0.5); }
        
        /* Navigation and UI elements */
        .nav-brand-active { 
          background-color: rgba(var(--px-primary-rgb), 0.1); 
          color: var(--px-primary);
          border-color: rgba(var(--px-primary-rgb), 0.3);
        }
        
        /* Button variants */
        .btn-brand {
          background-color: var(--px-primary);
          color: white;
        }
        .btn-brand:hover {
          background-color: rgba(var(--px-primary-rgb), 0.9);
        }
        .btn-brand-outline {
          border-color: var(--px-primary);
          color: var(--px-primary);
        }
        .btn-brand-outline:hover {
          background-color: rgba(var(--px-primary-rgb), 0.1);
        }
      `}</style>
      
      <header className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between bg-neutral-900">
        <div className="font-semibold text-neutral-200">
          <span className="text-brand font-bold">{brandName}</span> 
          <span className="text-neutral-400 mx-2">/</span>
          <span className="text-neutral-300 capitalize">{params.tenant}</span>
        </div>
        <TenantNavigation tenant={params.tenant} />
      </header>
      
      <div className="flex-1">
        <TenantProvider tenant={params.tenant}>
          {children}
        </TenantProvider>
      </div>
    </div>
  );
}
