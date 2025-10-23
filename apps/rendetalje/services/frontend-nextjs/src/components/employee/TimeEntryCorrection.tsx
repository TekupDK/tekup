'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Edit, 
  Save, 
  X, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Coffee,
  FileText
} from 'lucide-react';
import { TimeEntry } from '../../types';
import { api } from '../../lib/api';

interface TimeEntryCorrectionProps {
  employeeId: string;
  onCorrectionSubmitted?: (correction: TimeCorrection) => void;
}

interface TimeCorrection {
  id: string;
  original_entry_id: string;
  original_start_time: string;
  original_end_time?: string;
  original_break_duration: number;
  corrected_start_time: string;
  corrected_end_time?: string;
  corrected_break_duration: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
}

export const TimeEntryCorrection: React.FC<TimeEntryCorrectionProps> = ({
  employeeId,
  onCorrectionSubmitted
}) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [corrections, setCorrections] = useState<TimeCorrection[]>([]);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [correctionForm, setCorrectionForm] = useState({
    start_time: '',
    end_time: '',
    break_duration: 0,
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTimeEntries();
    fetchCorrections();
  }, [employeeId, selectedDate]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/time-entries', {
        params: {
          employee_id: employeeId,
          date: selectedDate
        }
      });
      
      setTimeEntries(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch time entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchCorrections = async () => {
    try {
      const response = await api.get('/time-corrections', {
        params: {
          employee_id: employeeId,
          date: selectedDate
        }
      });
      
      setCorrections(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch corrections:', err);
    }
  };

  const startEditing = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setCorrectionForm({
      start_time: entry.start_time.split('T')[1].substring(0, 5), // Extract time part
      end_time: entry.end_time ? entry.end_time.split('T')[1].substring(0, 5) : '',
      break_duration: entry.break_duration || 0,
      reason: ''
    });
  };

  const cancelEditing = () => {
    setEditingEntry(null);
    setCorrectionForm({
      start_time: '',
      end_time: '',
      break_duration: 0,
      reason: ''
    });
  };

  const submitCorrection = async () => {
    if (!editingEntry || !correctionForm.reason.trim()) {
      setError('Årsag til rettelse er påkrævet');
      return;
    }

    try {
      setError(null);
      
      const correctedStartTime = `${selectedDate}T${correctionForm.start_time}:00`;
      const correctedEndTime = correctionForm.end_time 
        ? `${selectedDate}T${correctionForm.end_time}:00` 
        : undefined;

      const correction = {
        original_entry_id: editingEntry.id,
        corrected_start_time: correctedStartTime,
        corrected_end_time: correctedEndTime,
        corrected_break_duration: correctionForm.break_duration,
        reason: correctionForm.reason
      };

      const response = await api.post('/time-corrections', correction);
      
      setCorrections(prev => [response.data, ...prev]);
      cancelEditing();
      
      if (onCorrectionSubmitted) {
        onCorrectionSubmitted(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit correction');
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}t ${mins}m`;
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('da-DK', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (start: string, end?: string, breakDuration: number = 0) => {
    if (!end) return 0;
    
    const startTime = new Date(start);
    const endTime = new Date(end);
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / 1000 / 60;
    
    return Math.max(0, totalMinutes - breakDuration);
  };

  const getEntryCorrection = (entryId: string) => {
    return corrections.find(c => c.original_entry_id === entryId);
  };

  const getCorrectionStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCorrectionStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Afventer';
      case 'approved': return 'Godkendt';
      case 'rejected': return 'Afvist';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Tidsrettelser</h3>
          <p className="text-gray-600">Ret fejl i dine tidsregistreringer</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Time Entries List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-md font-medium text-gray-900">
            Tidsregistreringer for {new Date(selectedDate).toLocaleDateString('da-DK')}
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : timeEntries.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen tidsregistreringer</h3>
            <p className="mt-1 text-sm text-gray-500">
              Der er ingen tidsregistreringer for denne dag
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {timeEntries.map((entry) => {
              const correction = getEntryCorrection(entry.id);
              const isEditing = editingEntry?.id === entry.id;
              const duration = calculateDuration(entry.start_time, entry.end_time, entry.break_duration);

              return (
                <div key={entry.id} className="p-4">
                  {isEditing ? (
                    /* Editing Form */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Tid
                          </label>
                          <input
                            type="time"
                            value={correctionForm.start_time}
                            onChange={(e) => setCorrectionForm(prev => ({ ...prev, start_time: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slut Tid
                          </label>
                          <input
                            type="time"
                            value={correctionForm.end_time}
                            onChange={(e) => setCorrectionForm(prev => ({ ...prev, end_time: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pause (minutter)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={correctionForm.break_duration}
                            onChange={(e) => setCorrectionForm(prev => ({ ...prev, break_duration: Number(e.target.value) }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Årsag til rettelse *
                        </label>
                        <textarea
                          value={correctionForm.reason}
                          onChange={(e) => setCorrectionForm(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="Beskriv hvorfor denne rettelse er nødvendig..."
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <X className="w-4 h-4 mr-2 inline" />
                          Annuller
                        </button>
                        <button
                          onClick={submitCorrection}
                          disabled={!correctionForm.reason.trim()}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-4 h-4 mr-2 inline" />
                          Indsend Rettelse
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {entry.job_id ? `Job ${entry.job_id}` : 'Generelt arbejde'}
                            </p>
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              <span>
                                {formatDateTime(entry.start_time)} - {entry.end_time ? formatDateTime(entry.end_time) : 'Igangværende'}
                              </span>
                              {entry.break_duration && entry.break_duration > 0 && (
                                <span className="flex items-center">
                                  <Coffee className="w-3 h-3 mr-1" />
                                  {formatTime(entry.break_duration)} pause
                                </span>
                              )}
                              <span className="font-medium">
                                Total: {formatTime(duration)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Correction Status */}
                        {correction && (
                          <div className="mt-2 p-2 bg-gray-50 rounded border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 text-blue-600 mr-2" />
                                <span className="text-sm text-gray-700">Rettelse indsendt</span>
                                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCorrectionStatusColor(correction.status)}`}>
                                  {getCorrectionStatusText(correction.status)}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{correction.reason}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {!correction && entry.end_time && (
                          <button
                            onClick={() => startEditing(entry)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                            title="Ret tidsregistrering"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Corrections */}
      {corrections.filter(c => c.status === 'pending').length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-md font-medium text-gray-900">Afventende Rettelser</h4>
          </div>
          
          <div className="divide-y divide-gray-200">
            {corrections
              .filter(c => c.status === 'pending')
              .map((correction) => (
                <div key={correction.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          Rettelse afventer godkendelse
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium">Original:</p>
                            <p>{formatDateTime(correction.original_start_time)} - {correction.original_end_time ? formatDateTime(correction.original_end_time) : 'N/A'}</p>
                            <p>Pause: {formatTime(correction.original_break_duration)}</p>
                          </div>
                          <div>
                            <p className="font-medium">Rettet til:</p>
                            <p>{formatDateTime(correction.corrected_start_time)} - {correction.corrected_end_time ? formatDateTime(correction.corrected_end_time) : 'N/A'}</p>
                            <p>Pause: {formatTime(correction.corrected_break_duration)}</p>
                          </div>
                        </div>
                        <p className="mt-2"><strong>Årsag:</strong> {correction.reason}</p>
                      </div>
                    </div>
                    
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCorrectionStatusColor(correction.status)}`}>
                      {getCorrectionStatusText(correction.status)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};