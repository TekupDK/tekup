import { ReactNode } from 'react';

export interface RouteConfig {
  path: string;
  element: ReactNode;
  title: string;
  protected?: boolean;
  roles?: string[];
  children?: RouteConfig[];
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
  badge?: string | number;
}

export interface RouteGuard {
  canActivate: () => boolean;
  redirectTo?: string;
}
