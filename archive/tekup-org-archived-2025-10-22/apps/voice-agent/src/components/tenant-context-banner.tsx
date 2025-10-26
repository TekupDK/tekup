'use client';

import React from 'react';
import { TenantSettings } from '@tekup/shared';

interface TenantContextBannerProps {
  tenant: string;
  settings: TenantSettings | null;
}

export const TenantContextBanner: React.FC<TenantContextBannerProps> = ({ 
  tenant, 
  settings 
}) => {
  if (!settings) {
    return (
      <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
          <span className="ml-2 text-neutral-400">Indlæser tenant information...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: settings.theme_primary_color }}
          ></div>
          <div>
            <h3 className="text-sm font-medium text-neutral-200">
              Arbejder for: {settings.brand_display_name || tenant}
            </h3>
            <p className="text-xs text-neutral-400">
              Tenant: {tenant} • Alle handlinger er isoleret til denne tenant
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-neutral-400">Aktiv Tenant</div>
          <div 
            className="text-sm font-medium capitalize"
            style={{ color: settings.theme_primary_color }}
          >
            {tenant}
          </div>
        </div>
      </div>
      
      {/* Tenant Details */}
      <div className="mt-3 pt-3 border-t border-neutral-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-neutral-400">Domain:</span>
            <span className="ml-2 text-neutral-300">{settings.domain}</span>
          </div>
          <div>
            <span className="text-neutral-400">Status:</span>
            <span className="ml-2 text-green-400">Aktiv</span>
          </div>
          <div>
            <span className="text-neutral-400">Oprettet:</span>
            <span className="ml-2 text-neutral-300">
              {settings.created_at.toLocaleDateString('da-DK')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};