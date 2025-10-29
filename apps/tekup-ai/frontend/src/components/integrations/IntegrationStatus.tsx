'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface IntegrationStatusProps {
  status: 'connected' | 'disconnected' | 'error';
}

export function IntegrationStatus({ status }: IntegrationStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          label: 'Connected',
          className: 'bg-green-500/10 text-green-500 border-green-500/20',
        };
      case 'disconnected':
        return {
          icon: AlertCircle,
          label: 'Disconnected',
          className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        };
      case 'error':
        return {
          icon: XCircle,
          label: 'Error',
          className: 'bg-destructive/10 text-destructive border-destructive/20',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}
