/**
 * Time Tracker Component (Category B - Sprint 2)
 * 
 * Professional timer for tracking actual work time on bookings
 * Features:
 * - Start/Stop/Pause/Resume timer
 * - Real-time display with millisecond precision
 * - Break management
 * - Efficiency scoring (actual vs estimated time)
 * - Time notes and variance calculation
 */

import { useState, useEffect } from 'react';
import { Play, Pause, Square, Coffee, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/textarea';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

interface TimeTrackerProps {
  bookingId: string;
  estimatedDuration: number; // minutes
  onComplete?: () => void;
}

interface Break {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  reason?: string;
}

const TimeTracker = ({ bookingId, estimatedDuration, onComplete }: TimeTrackerProps) => {
  const [timerStatus, setTimerStatus] = useState<'not_started' | 'running' | 'paused' | 'completed'>('not_started');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // seconds
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [currentBreak, setCurrentBreak] = useState<Break | null>(null);
  const [timeNotes, setTimeNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Real-time timer update
  useEffect(() => {
    if (timerStatus !== 'running') return;

    const interval = setInterval(() => {
      if (startTime) {
        const now = new Date();
        const totalSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const breakSeconds = breaks.reduce((sum, b) => sum + (b.duration || 0) * 60, 0);
        setElapsedTime(totalSeconds - breakSeconds);
      }
    }, 100); // Update every 100ms for smooth display

    return () => clearInterval(interval);
  }, [timerStatus, startTime, breaks]);

  const handleStart = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/time-tracking/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await response.json();

      if (data.success) {
        setTimerStatus('running');
        setStartTime(new Date(data.actualStartTime));
      }
    } catch (error) {
      console.error('Error starting timer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/time-tracking/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await response.json();

      if (data.success) {
        setTimerStatus('paused');
        setCurrentBreak({
          id: data.breakId,
          startTime: data.startTime,
        });
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    if (!currentBreak) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/time-tracking/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          breakId: currentBreak.id,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setTimerStatus('running');
        setBreaks([...breaks, {
          ...currentBreak,
          endTime: data.endTime,
          duration: data.duration,
        }]);
        setCurrentBreak(null);
      }
    } catch (error) {
      console.error('Error resuming timer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/time-tracking/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          timeNotes,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setTimerStatus('completed');
        onComplete?.();
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEfficiencyColor = () => {
    const estimatedSeconds = estimatedDuration * 60;
    const variance = ((elapsedTime - estimatedSeconds) / estimatedSeconds) * 100;

    if (variance <= -10) return 'text-green-400'; // Under time
    if (variance <= 10) return 'text-cyan-400'; // On time
    return 'text-yellow-400'; // Over time
  };

  const getVarianceText = () => {
    const estimatedSeconds = estimatedDuration * 60;
    const varianceSeconds = elapsedTime - estimatedSeconds;
    const varianceMinutes = Math.abs(Math.floor(varianceSeconds / 60));

    if (varianceSeconds < -60) return `${varianceMinutes} min under estimat`;
    if (varianceSeconds > 60) return `${varianceMinutes} min over estimat`;
    return 'På tid';
  };

  const totalBreakTime = breaks.reduce((sum, b) => sum + (b.duration || 0), 0);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Tidsregistrering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Timer Display */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className={`text-6xl font-mono font-bold ${getEfficiencyColor()}`}>
              {formatTime(elapsedTime)}
            </div>
            {timerStatus === 'running' && (
              <div className="absolute -top-2 -right-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex justify-center gap-2">
            {timerStatus === 'not_started' && (
              <Badge variant="outline">Ikke startet</Badge>
            )}
            {timerStatus === 'running' && (
              <Badge className="bg-green-500/20 text-green-400">
                <span className="animate-pulse mr-1">●</span>
                Kører
              </Badge>
            )}
            {timerStatus === 'paused' && (
              <Badge className="bg-yellow-500/20 text-yellow-400">
                Pause
              </Badge>
            )}
            {timerStatus === 'completed' && (
              <Badge className="bg-cyan-500/20 text-cyan-400">
                Gennemført
              </Badge>
            )}
          </div>

          {/* Variance Indicator */}
          {timerStatus !== 'not_started' && timerStatus !== 'completed' && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <TrendingUp className={`w-4 h-4 ${getEfficiencyColor()}`} />
              <span className={getEfficiencyColor()}>
                {getVarianceText()}
              </span>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {timerStatus === 'not_started' && (
            <Button
              onClick={handleStart}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Timer
            </Button>
          )}

          {timerStatus === 'running' && (
            <>
              <Button
                onClick={handlePause}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <Coffee className="w-4 h-4 mr-2" />
                Pause
              </Button>
              <Button
                onClick={handleStop}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </>
          )}

          {timerStatus === 'paused' && (
            <Button
              onClick={handleResume}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Genoptag
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 p-4 glass rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {Math.floor(estimatedDuration / 60)}:{(estimatedDuration % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground">Estimat</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground">Faktisk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {totalBreakTime}
            </div>
            <div className="text-xs text-muted-foreground">Pause (min)</div>
          </div>
        </div>

        {/* Breaks List */}
        {breaks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              Pauser ({breaks.length})
            </h4>
            <div className="space-y-1">
              {breaks.map((breakItem, index) => (
                <div key={breakItem.id} className="flex items-center justify-between text-sm p-2 glass rounded">
                  <span>Pause #{index + 1}</span>
                  <Badge variant="outline">{breakItem.duration} min</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Notes */}
        {(timerStatus === 'running' || timerStatus === 'paused') && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">
              Noter om tid (valgfrit)
            </label>
            <Textarea
              value={timeNotes}
              onChange={(e) => setTimeNotes(e.target.value)}
              placeholder="F.eks. 'Ekstra tid brugt på vinduer pga. regn'"
              className="min-h-[80px] glass"
            />
          </div>
        )}

        {/* Efficiency Alert */}
        {timerStatus === 'running' && elapsedTime > estimatedDuration * 60 * 1.2 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-400">Overskridelse af estimat</p>
              <p className="text-muted-foreground">
                Du er {Math.floor((elapsedTime - estimatedDuration * 60) / 60)} minutter over det estimerede tidsforbrug.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeTracker;
