"use client";
import { useState } from 'react';

const TENANTS = [
  { id: 'tekup', name: 'TekUp', color: '#7c3aed' },
  { id: 'rendetalje', name: 'Rendetalje', color: '#059669' },
  { id: 'foodtruck', name: 'FoodTruck', color: '#dc2626' }
];

export function TenantSwitcher() {
  const [tenant, setTenant] = useState('tekup');

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-zinc-400">Tenant</label>
      <select
        className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-sm"
        value={tenant}
        onChange={(e) => {
          const t = e.target.value;
          setTenant(t);
          if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--brand-color', TENANTS.find(x => x.id === t)?.color || '#7c3aed');
          }
        }}
      >
        {TENANTS.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--brand-color, #7c3aed)' }} />
    </div>
  );
}
