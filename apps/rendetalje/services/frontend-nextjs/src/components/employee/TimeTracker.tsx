'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Coffee, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Timer,
  BarChart3
} from 'lucide-react';
import { TimeEntry } from '../../types';
import { api } from '../../lib/api';

interface TimeTrackerProps {
  employeeId: string;
  jobId?: string;
  onTimeUpdate?: (timeEntry: TimeEntry) => void;
}

interface ActiveTimer {
  id: string;
  jobId?: string;
  startTime: Date;
  breakStartTime?: Date;
  totalBreakTime: number;
  status: 'working' | 'break' | 'stopped';
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({
  employeeId,
  jobId,
  onTimeUpdate
}) => {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load today's time entries
  useEffect(() => {
    fetchTodayEntries();
  }, [employeeId]);

  const fetchTodayEntries = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const response = await api.get('/time-entries', {
        params: {
          employee_id: employeeId,
          date: today
        }
      });
      
      setTodayEntries(response.data.data || []);
      
      // Check if there's an active timer
      const activeEntry = response.data.data?.find((entry: TimeEntry) => !entry.end_time);
      if (activeEntry) {
        setActiveTimer({
          id: activeEntry.id,
          jobId: activeEntry.job_id,
          startTime: new Date(activeEntry.start_time),
          totalBreakTime: activeEntry.break_duration || 0,
          status: 'working'
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch time entries');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async () => {
    try {
      setError(null);
      
      const response = await api.post('/time-entries', {
        job_id: jobId,
        team_member_id: employeeId,
        start_time: new Date().toISOString()
      });

      const newTimer: ActiveTimer = {
        id: response.data.id,
        jobId: jobId,
        startTime: new Date(),
        totalBreakTime: 0,
        status: 'working'
      };

      setActiveTimer(newTimer);
      
      if (onTimeUpdate) {
        onTimeUpdate(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start timer');
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      setError(null);
      
      const endTime = new Date().toISOString();
      
      const response = await api.patch(`/time-entries/${activeTimer.id}`, {
        end_time: endTime,
        break_duration: activeTimer.totalBreakTime
      });

      setActiveTimer(null);
      await fetchTodayEntries();
      
      if (onTimeUpdate) {
        onTimeUpdate(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to stop timer');
    }
  };

  const startBreak = () => {
    if (!activeTimer || activeTimer.status === 'break') return;

    setActiveTimer(prev => prev ? {
      ...prev,
      breakStartTime: new Date(),
      status: 'break'
    } : null);
  };

  const endBreak = () => {
    if (!activeTimer || activeTimer.status !== 'break' || !activeTimer.breakStartTime) return;

    const breakDuration = (new Date().getTime() - activeTimer.breakStartTime.getTime()) / 1000 / 60; // minutes
    
    setActiveTimer(prev => prev ? {
      ...prev,
      breakStartTime: undefined,
      totalBreakTime: prev.totalBreakTime + breakDuration,
      status: 'working'
    } : null);
  };

  const getElapsedTime = () => {
    if (!activeTimer) return 0;
    
    const elapsed = (currentTime.getTime() - activeTimer.startTime.getTime()) / 1000 / 60; // minutes
    return Math.max(0, elapsed - activeTimer.totalBreakTime);
  };

  const getCurrentBreakTime = () => {
    if (!activeTimer || !activeTimer.breakStartTime) return 0;
    
    return (currentTime.getTime() - activeTimer.breakStartTime.getTime()) / 1000 / 60; // minutes
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTodayStats = () => {
    const totalWorked = todayEntries.reduce((total, entry) => {
      if (entry.end_time) {
        const start = new Date(entry.start_time);
        const end = new Date(entry.end_time);
        const duration = (end.getTime() - start.getTime()) / 1000 / 60; // minutes
        return total + duration - (entry.break_duration || 0);
      }
      return total;
    }, 0);

    const currentWorked = activeTimer ? getElapsedTime() : 0;
    const totalBreaks = todayEntries.reduce((total, entry) => total + (entry.break_duration || 0), 0);
    const currentBreak = activeTimer ? activeTimer.totalBreakTime + getCurrentBreakTime() : 0;

    return {
      totalWorked: totalWorked + currentWorked,
      totalBreaks: totalBreaks + currentBreak,
      entries: todayEntries.length + (activeTimer ? 1 : 0)
    };
  };

  const stats = getTodayStats();
  const isOvertime = stats.totalWorked > 8 * 60; // 8 hours in minutes

  return (
    <div className="space-y-6">
      {/* Current Timer Display */}
      <div className={`bg-white rounded-lg border-2 p-6 ${
        activeTimer 
          ? activeTimer.status === 'working' 
            ? 'border-green-300 bg-green-50' 
            : 'border-yellow-300 bg-yellow-50'
          : 'border-gray-200'
      }`}>
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
            {activeTimer ? formatTime(getElapsedTime()) : '00:00:00'}
          </div>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              activeTimer 
                ? activeTimer.status === 'working' 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-yellow-500 animate-pulse'
                : 'bg-gray-300'
            }`} />
            <span className="text-sm font-medium text-gray-700">
              {activeTimer 
                ? activeTimer.status === 'working' 
                  ? 'Arbejder' 
                  : 'På pause'
                : 'Ikke startet'
              }
            </span>
          </div>

          {activeTimer && jobId && (
            <p className="text-sm text-gray-600 mb-4">
              Job: {jobId}
            </p>
          )}

          {/* Timer Controls */}
          <div className="flex justify-center space-x-3">
            {!activeTimer ? (
              <button
                onClick={startTimer}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Arbejde
              </button>
            ) : (
              <>
                {activeTimer.status === 'working' ? (
                  <button
                    onClick={startBreak}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                  >
                    <Coffee className="w-4 h-4" />
                    Start Pause
                  </button>
                ) : (
                  <button
                    onClick={endBreak}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Slut Pause
                  </button>
                )}
                
                <button
                  onClick={stopTimer}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop Arbejde
                </button>
              </>
            )}
          </div>
        </div>

        {/* Break Time Display */}
        {activeTimer && (activeTimer.totalBreakTime > 0 || activeTimer.status === 'break') && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total pause tid:</span>
              <span className="font-medium">
                {formatTime(activeTimer.totalBreakTime + getCurrentBreakTime())}
              </span>
            </div>
            {activeTimer.status === 'break' && (
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600">Nuværende pause:</span>
                <span className="font-medium text-yellow-600">
                  {formatTime(getCurrentBreakTime())}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Today's Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Arbejdstid I dag</p>
              <p className={`text-xl font-bold ${isOvertime ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(stats.totalWorked)}
              </p>
              {isOvertime && (
                <div className="flex items-center text-xs text-red-600 mt-1">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Overarbejde
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Coffee className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pause Tid</p>
              <p className="text-xl font-bold text-gray-900">
                {formatTime(stats.totalBreaks)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Arbejdsperioder</p>
              <p className="text-xl font-bold text-gray-900">{stats.entries}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Time Entries */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Dagens Tidsregistreringer</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {activeTimer && (
            <div className="p-4 bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Aktiv periode {activeTimer.jobId && `- Job ${activeTimer.jobId}`}
                    </p>
                    <p className="text-xs text-gray-600">
                      Startet: {activeTimer.startTime.toLocaleTimeString('da-DK')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatTime(getElapsedTime())}
                  </p>
                  <p className="text-xs text-gray-600">
                    Status: {activeTimer.status === 'working' ? 'Arbejder' : 'På pause'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {todayEntries.map((entry) => {
            const start = new Date(entry.start_time);
            const end = entry.end_time ? new Date(entry.end_time) : null;
            const duration = end ? (end.getTime() - start.getTime()) / 1000 / 60 : 0;
            const workTime = duration - (entry.break_duration || 0);

            return (
              <div key={entry.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {entry.job_id ? `Job ${entry.job_id}` : 'Generelt arbejde'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {start.toLocaleTimeString('da-DK')} - {end?.toLocaleTimeString('da-DK') || 'Igangværende'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatTime(workTime)}
                    </p>
                    {entry.break_duration && entry.break_duration > 0 && (
                      <p className="text-xs text-gray-600">
                        Pause: {formatTime(entry.break_duration)}
                      </p>
                    )}
                  </div>
                </div>
                
                {entry.notes && (
                  <p className="mt-2 text-xs text-gray-600 ml-8">
                    {entry.notes}
                  </p>
                )}
              </div>
            );
          })}

          {todayEntries.length === 0 && !activeTimer && (
            <div className="p-8 text-center">
              <Timer className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen tidsregistreringer</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start din første arbejdsperiode i dag
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Overtime Warning */}
      {isOvertime && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-orange-800">Overarbejde Advarsel</p>
              <p className="text-sm text-orange-700">
                Du har arbejdet {formatTime(stats.totalWorked - 8 * 60)} over normal arbejdstid i dag.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};