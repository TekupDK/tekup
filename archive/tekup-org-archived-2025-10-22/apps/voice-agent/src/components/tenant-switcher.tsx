'use client';

import React from 'react';
import { useVoiceTenant } from '@/contexts/voice-tenant-context';

export const TenantSwitcher: React.FC = () => {
  const { currentTenant, switchTenant, allowedTenants } = useVoiceTenant();
  
  const tenants = [
    { id: 'rendetalje', label: 'Rendetalje', color: '#059669' },
    { id: 'foodtruck', label: 'FoodTruck', color: '#dc2626' },
    { id: 'tekup', label: 'TekUp', color: '#7c3aed' }
  ];
  
  const handleTenantChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTenant = event.target.value;
    if (newTenant !== currentTenant) {
      switchTenant(newTenant);
    }
  };
  
  return (
    <div className="relative">
      <select
        value={currentTenant}
        onChange={handleTenantChange}
        className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-200 focus:border-brand focus:ring-brand focus:ring-1 focus:outline-none appearance-none pr-8"
      >
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.label}
          </option>
        ))}
      </select>
      
      {/* Tenant Color Indicator */}
      <div 
        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full"
        style={{ 
          backgroundColor: tenants.find(t => t.id === currentTenant)?.color 
        }}
      ></div>
      
      {/* Custom Dropdown Arrow */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};