"use client";
import React, { useEffect, useState } from 'react';
import { getApiBase, getDevTenantKey } from '../../../../lib/config';
function getTenantKey(_tenant: string){ return getDevTenantKey(); }

interface SettingsState {
  brand_display_name?: string;
  theme_primary_color?: string;
  sla_response_minutes?: number;
  duplicate_window_minutes?: number;
  enable_advanced_parser?: boolean;
}

async function fetchSettings(tenant: string): Promise<SettingsState> {
  const res = await fetch(`${getApiBase()}/settings`, { headers: { 'x-tenant-key': getTenantKey(tenant) } });
  if (!res.ok) throw new Error('Failed');
  const data = await res.json();
  return data.settings || {};
}

async function saveSettings(tenant: string, updates: Partial<SettingsState>): Promise<SettingsState> {
  const res = await fetch(`${getApiBase()}/settings`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-tenant-key': getTenantKey(tenant) }, body: JSON.stringify({ updates }) });
  if (!res.ok) throw new Error('Failed');
  return (await res.json()).settings;
}

export default function SettingsPage({ params }: { params: { tenant: string } }) {
  const tenant = params.tenant;
  const [settings, setSettings] = useState<SettingsState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings(tenant).then(s => { setSettings(s); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); });
  }, [tenant]);

  function update<K extends keyof SettingsState>(k: K, v: SettingsState[K]) { setSettings(prev => ({ ...prev, [k]: v })); }

  async function onSave() {
    setSaving(true); setError(undefined);
    try { const saved = await saveSettings(tenant, settings); setSettings(saved); } catch(e:any){ setError(e.message);} finally { setSaving(false); }
  }

  if (loading) return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-neutral-800 rounded w-32 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-neutral-800 rounded w-24"></div>
          <div className="h-10 bg-neutral-800 rounded w-64"></div>
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="p-6">
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <h3 className="text-red-400 font-medium mb-2">Error Loading Settings</h3>
        <p className="text-red-300 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-neutral-400">Configure your workspace branding and lead management preferences</p>
      </div>

      <div className="space-y-8">
        {/* Branding Section */}
        <section className="bg-neutral-900/50 rounded-lg p-6 border border-neutral-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-brand rounded-full"></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Branding</h2>
              <p className="text-sm text-neutral-400">Customize your workspace appearance</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-sm font-medium text-neutral-300 mb-2 block">Display Name</span>
              <input 
                type="text"
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:border-brand focus:ring-1 focus:ring-brand/50 transition-colors text-white placeholder-neutral-500"
                placeholder="Your Brand Name"
                value={settings.brand_display_name || ''} 
                onChange={e => update('brand_display_name', e.target.value)} 
              />
              <p className="text-xs text-neutral-500 mt-1">This will appear in the header and page titles</p>
            </label>
            
            <label className="block">
              <span className="text-sm font-medium text-neutral-300 mb-2 block">Primary Color</span>
              <div className="flex gap-2">
                <input 
                  type="color"
                  className="w-12 h-10 bg-neutral-800 border border-neutral-700 rounded cursor-pointer"
                  value={settings.theme_primary_color || '#2563eb'} 
                  onChange={e => update('theme_primary_color', e.target.value)} 
                />
                <input 
                  type="text"
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:border-brand focus:ring-1 focus:ring-brand/50 transition-colors text-white font-mono text-sm"
                  placeholder="#2563eb"
                  value={settings.theme_primary_color || ''} 
                  onChange={e => update('theme_primary_color', e.target.value)} 
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">Used for navigation, buttons, and accents</p>
            </label>
          </div>
          
          {/* Brand Preview */}
          {settings.brand_display_name && (
            <div className="mt-6 p-4 bg-neutral-800/50 rounded-md border-l-4 border-brand">
              <h4 className="text-sm font-medium text-neutral-300 mb-2">Preview</h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-brand font-bold">{settings.brand_display_name}</span>
                <span className="text-neutral-400">/</span>
                <span className="text-neutral-300">{tenant}</span>
              </div>
            </div>
          )}
        </section>

        {/* Lead Management Section */}
        <section className="bg-neutral-900/50 rounded-lg p-6 border border-neutral-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-brand rounded-full"></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Lead Management</h2>
              <p className="text-sm text-neutral-400">Configure lead processing and SLA settings</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-sm font-medium text-neutral-300 mb-2 block">SLA Response Time (minutes)</span>
              <input 
                type="number"
                min="1"
                max="1440"
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:border-brand focus:ring-1 focus:ring-brand/50 transition-colors text-white"
                placeholder="60"
                value={settings.sla_response_minutes || ''} 
                onChange={e => update('sla_response_minutes', Number(e.target.value))} 
              />
              <p className="text-xs text-neutral-500 mt-1">Maximum time to respond to new leads</p>
            </label>
            
            <label className="block">
              <span className="text-sm font-medium text-neutral-300 mb-2 block">Duplicate Detection Window (minutes)</span>
              <input 
                type="number"
                min="1"
                max="1440"
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:border-brand focus:ring-1 focus:ring-brand/50 transition-colors text-white"
                placeholder="5"
                value={settings.duplicate_window_minutes || ''} 
                onChange={e => update('duplicate_window_minutes', Number(e.target.value))} 
              />
              <p className="text-xs text-neutral-500 mt-1">Time window for detecting duplicate leads</p>
            </label>
          </div>
          
          <div className="mt-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={!!settings.enable_advanced_parser} 
                  onChange={e => update('enable_advanced_parser', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  settings.enable_advanced_parser 
                    ? 'bg-brand border-brand' 
                    : 'border-neutral-600 group-hover:border-neutral-500'
                }`}>
                  {settings.enable_advanced_parser && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-neutral-300 block">Enable Advanced Parser</span>
                <span className="text-xs text-neutral-500">Enhanced email parsing for complex lead formats (coming soon)</span>
              </div>
            </label>
          </div>
        </section>
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-0 -mx-6 mt-8 p-6 bg-gradient-to-t from-neutral-900 via-neutral-900/95 to-transparent">
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-400">
            {saving ? 'Saving changes...' : 'Changes will be applied immediately'}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 text-neutral-400 hover:text-neutral-200 transition-colors"
              disabled={saving}
            >
              Reset
            </button>
            <button 
              onClick={onSave} 
              disabled={saving} 
              className="btn-brand px-6 py-2 rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
