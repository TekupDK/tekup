"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TenantNavigationProps {
  tenant: string;
}

export default function TenantNavigation({ tenant }: TenantNavigationProps) {
  const pathname = usePathname();
  
  const navItems = [
    {
      href: `/t/${tenant}/leads`,
      label: 'Leads',
      isActive: pathname.startsWith(`/t/${tenant}/leads`)
    },
    {
      href: `/t/${tenant}/settings`,
      label: 'Settings',
      isActive: pathname.startsWith(`/t/${tenant}/settings`)
    }
  ];

  return (
    <nav className="text-sm space-x-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-3 py-2 rounded-md transition-all duration-200 ${
            item.isActive
              ? 'nav-brand-active font-medium shadow-sm'
              : 'text-neutral-400 hover:text-brand hover:bg-brand/5 hover:border-transparent'
          }`}
        >
          {item.label}
        </Link>
      ))}
      {/* Future: events, tickets, estimation, dashboard */}
    </nav>
  );
}