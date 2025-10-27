'use client';

import { useState } from 'react';
import { Calendar, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface CalendarSyncButtonProps {
  onSyncComplete: () => void;
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export function CalendarSyncButton({ onSyncComplete }: CalendarSyncButtonProps) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [message, setMessage] = useState<string>('');

  const handleSync = async () => {
    setStatus('syncing');
    setMessage('Syncing calendar events...');

    try {
      // Get current month range
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calendarId: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || 'primary',
          startDate,
          endDate,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage(`Synced ${result.data.synced} new jobs, updated ${result.data.updated} existing jobs`);
        onSyncComplete();
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to sync calendar');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to sync calendar');
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'syncing':
        return (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Syncing...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-4 h-4" />
            Synced
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4" />
            Error
          </>
        );
      default:
        return (
          <>
            <Calendar className="w-4 h-4" />
            Sync Calendar
          </>
        );
    }
  };

  const getButtonColor = () => {
    switch (status) {
      case 'syncing':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleSync}
        disabled={status === 'syncing'}
        className={`flex items-center space-x-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${getButtonColor()}`}
      >
        {getButtonContent()}
      </button>

      {message && (
        <div className={`text-sm px-3 py-1 rounded-md ${
          status === 'success'
            ? 'text-green-700 bg-green-100'
            : status === 'error'
            ? 'text-red-700 bg-red-100'
            : 'text-blue-700 bg-blue-100'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}