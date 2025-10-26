/**
 * Time Tracker Widget (Sprint 2)
 * Real-time timer display for active bookings
 */

import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Coffee, Clock } from 'lucide-react';

interface TimeTrackerWidgetProps {
  bookingId: string;
  estimatedDuration: number; // minutes
  onTimerUpdate?: (status: TimerStatus) => void;
}

interface TimerStatus {
  isRunning: boolean;
  isPaused: boolean;
  elapsedMinutes: number;
  actualStartTime?: Date;
  breaks: Break[];
}

interface Break {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  reason?: string;
}

export function TimeTrackerWidget({
  bookingId,
  estimatedDuration,
  onTimerUpdate,
}: TimeTrackerWidgetProps) {
  const [status, setStatus] = useState<TimerStatus | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [breakReason, setBreakReason] = useState('');
  const [showBreakModal, setShowBreakModal] = useState(false);

  // Fetch timer status
  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/time-tracking/bookings/${bookingId}/status`);
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
        if (onTimerUpdate) onTimerUpdate(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch timer status:', error);
    }
  };

  // Start timer
  const startTimer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/time-tracking/bookings/${bookingId}/start-timer`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stop timer
  const stopTimer = async () => {
    if (!confirm('Er du sikker på at du vil stoppe timeren? Dette vil markere opgaven som fuldført.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/time-tracking/bookings/${bookingId}/stop-timer`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        await fetchStatus();
        alert(`Job afsluttet! Faktisk tid: ${data.data.actualDuration} minutter`);
      }
    } catch (error) {
      console.error('Failed to stop timer:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start break
  const startBreak = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/time-tracking/bookings/${bookingId}/start-break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: breakReason || 'other' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchStatus();
        setShowBreakModal(false);
        setBreakReason('');
      }
    } catch (error) {
      console.error('Failed to start break:', error);
    } finally {
      setLoading(false);
    }
  };

  // End break
  const endBreak = async (breakId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/time-tracking/breaks/${breakId}/end`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to end break:', error);
    } finally {
      setLoading(false);
    }
  };

  // Poll status every 5 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  // Update elapsed seconds every second
  useEffect(() => {
    if (status?.isRunning && status.actualStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(status.actualStartTime!);
        const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!status) {
    return <div className="p-4">Indlæser timer...</div>;
  }

  const activeBreak = status.breaks.find(b => !b.endTime);
  const completedBreaks = status.breaks.filter(b => b.endTime);
  const totalBreakMinutes = completedBreaks.reduce((sum, b) => sum + (b.duration || 0), 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Clock className="w-6 h-6" />
        Time Tracker
      </h3>

      {/* Timer Display */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-6 text-center">
        <div className="text-5xl font-mono font-bold mb-2">
          {status.isRunning || status.isPaused ? formatTime(elapsedSeconds) : '00:00:00'}
        </div>
        <div className="text-sm opacity-90">
          Estimeret: {estimatedDuration} min | Faktisk: {status.elapsedMinutes || 0} min
        </div>
        {status.isPaused && activeBreak && (
          <div className="mt-2 text-sm bg-yellow-500 bg-opacity-30 rounded px-3 py-1 inline-block">
            ☕ Pause ({activeBreak.reason})
          </div>
        )}
      </div>

      {/* Timer Controls */}
      <div className="flex gap-3 mb-6">
        {!status.isRunning && !status.isPaused && (
          <button
            onClick={startTimer}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
            Start Timer
          </button>
        )}

        {status.isRunning && !status.isPaused && (
          <>
            <button
              onClick={() => setShowBreakModal(true)}
              disabled={loading}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg px-4 py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Coffee className="w-5 h-5" />
              Tag Pause
            </button>
            <button
              onClick={stopTimer}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Square className="w-5 h-5" />
              Stop
            </button>
          </>
        )}

        {status.isPaused && activeBreak && (
          <button
            onClick={() => endBreak(activeBreak.id)}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
            Genoptag Timer
          </button>
        )}
      </div>

      {/* Breaks Summary */}
      {completedBreaks.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Pauser i dag:</h4>
          <div className="space-y-2">
            {completedBreaks.map((br) => (
              <div key={br.id} className="flex justify-between text-sm">
                <span>☕ {br.reason || 'Pause'}</span>
                <span className="text-gray-600">{br.duration} min</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t flex justify-between font-medium">
            <span>Total pausetid:</span>
            <span>{totalBreakMinutes} min</span>
          </div>
        </div>
      )}

      {/* Break Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Start Pause</h3>
            <label className="block mb-2 text-sm font-medium">
              Årsag til pause:
            </label>
            <select
              value={breakReason}
              onChange={(e) => setBreakReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            >
              <option value="">Vælg årsag...</option>
              <option value="lunch">Frokost</option>
              <option value="equipment">Udstyr/Forsyninger</option>
              <option value="bathroom">Toilet</option>
              <option value="transport">Transport</option>
              <option value="other">Andet</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBreakModal(false)}
                className="flex-1 border rounded-lg px-4 py-2"
              >
                Annuller
              </button>
              <button
                onClick={startBreak}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50"
              >
                Start Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Efficiency Indicator */}
      {status.elapsedMinutes > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm mb-1">
            <span>Effektivitet:</span>
            <span className={
              status.elapsedMinutes <= estimatedDuration ? 'text-green-600' : 'text-yellow-600'
            }>
              {Math.round((estimatedDuration / status.elapsedMinutes) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                status.elapsedMinutes <= estimatedDuration ? 'bg-green-600' : 'bg-yellow-600'
              }`}
              style={{
                width: `${Math.min((status.elapsedMinutes / estimatedDuration) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
