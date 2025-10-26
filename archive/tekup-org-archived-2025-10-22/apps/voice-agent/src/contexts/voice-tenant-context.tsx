'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TenantContext, TenantSettings, createLogger } from '@tekup/shared';

interface VoiceTenantContextType {
  currentTenant: string;
  tenantSettings: TenantSettings | null;
  tenantApiKey: string;
  switchTenant: (tenant: string) => void;
  isTenantActive: boolean;
  allowedTenants: string[];
}

const VoiceTenantContext = createContext<VoiceTenantContextType | undefined>(undefined);

export const useVoiceTenant = () => {
  const context = useContext(VoiceTenantContext);
  if (!context) {
    throw new Error('useVoiceTenant must be used within a VoiceTenantProvider');
  }
  return context;
};

export const VoiceTenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const logger = createLogger('apps-voice-agent-src-contexts-');

  const [currentTenant, setCurrentTenant] = useState<string>('tekup'); // Default
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [tenantApiKey, setTenantApiKey] = useState<string>('');
  const [isTenantActive, setIsTenantActive] = useState<boolean>(false);
  const [allowedTenants] = useState<string[]>(['rendetalje', 'foodtruck', 'tekup']);

  // Load tenant settings when tenant changes
  useEffect(() => {
    if (currentTenant) {
      loadTenantSettings(currentTenant);
      setIsTenantActive(true);
    }
  }, [currentTenant]);

  const loadTenantSettings = async (tenant: string) => {
    try {
      // Simuler tenant settings (i produktion ville dette komme fra API)
      const mockSettings: TenantSettings = {
        id: tenant,
        name: tenant,
        brand_display_name: getBrandName(tenant),
        theme_primary_color: getPrimaryColor(tenant),
        theme_primary_color_rgb: hexToRgb(getPrimaryColor(tenant)),
        domain: `${tenant}.tekup.dk`,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      setTenantSettings(mockSettings);

      // Simuler API key (i produktion ville dette komme fra auth system)
      setTenantApiKey(`demo-tenant-key-${tenant}`);

    } catch (error) {
      logger.error('Fejl ved indlæsning af tenant settings:', error);
    }
  };

  const getBrandName = (tenant: string): string => {
    const brandNames: Record<string, string> = {
      'rendetalje': 'Rendetalje',
      'foodtruck': 'FoodTruck',
      'tekup': 'TekUp'
    };
    return brandNames[tenant] || tenant;
  };

  const getPrimaryColor = (tenant: string): string => {
    const colors: Record<string, string> = {
      'rendetalje': '#059669',
      'foodtruck': '#dc2626',
      'tekup': '#7c3aed'
    };
    return colors[tenant] || '#7c3aed';
  };

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '124, 58, 237';
  };

  const switchTenant = (newTenant: string) => {
    if (allowedTenants.includes(newTenant)) {
      logger.info(`🔄 Switching tenant: ${currentTenant} → ${newTenant}`);
      setCurrentTenant(newTenant);
      setIsTenantActive(false); // Reset før ny tenant initialiseres
    } else {
      logger.error(`❌ Invalid tenant: ${newTenant}`);
    }
  };

  return (
    <VoiceTenantContext.Provider value={{
      currentTenant,
      tenantSettings,
      tenantApiKey,
      switchTenant,
      isTenantActive,
      allowedTenants
    }}>
      {children}
    </VoiceTenantContext.Provider>
  );
};
