"use client";
import React, { createContext, useContext } from 'react';

const TenantContext = createContext<string | undefined>(undefined);

export function TenantProvider({ tenant, children }: { tenant: string; children: React.ReactNode }) {
  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

export function useTenant(): string {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within a TenantProvider');
  return ctx;
}
