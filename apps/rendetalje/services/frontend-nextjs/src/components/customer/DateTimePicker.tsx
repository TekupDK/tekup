'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface DateTimePickerProps {
  onDateTimeSelect: (dateTime: BookingDateTime) => void;
  serviceDuration: number; // in minutes
  selectedDateTime?: BookingDateTime;
}

interface BookingDateTime {
  date: string;
  time: string;
  endTime: string;
}

interface TimeSlot {
  time: string;
  endTime: string;
  available: boolean;
  reason?: string;
}

interface AvailabilityData {
  [date: string]: TimeSlot[];
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  onDateTimeSelect,
  serviceDuration,
  selectedDateTime
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(selectedDateTime?.date || '');
  const [selectedTime, setSelectedTime] = useState<string>(selectedDateTime?.time || '');
  const [availability, setAvailability] = useState<AvailabilityData>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [currentMonth]);

  const fetchAvailability = async () => {
    setLoading(true);
    
    // Simulate API call to fetch availability
    // In real implementation, this would call the backend
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockAvailability: AvailabilityData = {};
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      
      // Skip Sundays
      if (dayOfWeek === 0) {
        mockAvailability[dateStr] = [];
        continue;
      }
      
      // Generate time slots
      const slots: TimeSlot[] = [];
      const workingHours = dayOfWeek === 6 ? [8, 14] : [8, 18]; // Saturday shorter hours
      
      for (let hour = workingHours[0]; hour < workingHours[1]; hour++) {
        for (let minute = 0; minute < 60; minute += 60) { // 1-hour slots
          const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const endHour = hour + Math.ceil(serviceDuration / 60);
          const endMinute = minute + (serviceDuration % 60);
          const endTime = `${endHour.toString().padStart(2, '0')}:${(endMinute % 60).toString().padStart(2, '0')}`;
          
          // Random availability for demo
          const isAvailable = Math.random() > 0.3;
          
          slots.push({
            time: startTime,
            endTime,
            available: isAvailable,
            reason: !isAvailable ? 'Optaget' : undefined
          });
        }
      }
      
      mockAvailability[dateStr] = slots;
    }
    
    setAvailability(mockAvailability);
    setLoading(false);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (timeSlot: TimeSlot) => {
    if (!timeSlot.available) return;
    
    setSelectedTime(timeSlot.time);
    
    const dateTime: BookingDateTime = {
      date: selectedDate,
      time: timeSlot.time,
      endTime: timeSlot.endTime
    };
    
    onDateTimeSelect(dateTime);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const isDateAvailable = (day: number | null) => {
    if (!day) return false;
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Can't book in the past
    if (date < today) return false;
    
    // Check if there are available slots
    const slots = availability[dateStr] || [];
    return slots.some(slot => slot.available);
  };

  const getAvailableSlots = (dateStr: string) => {
    return availability[dateStr]?.filter(slot => slot.available) || [];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('da-DK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}t ${mins}m`;
    } else if (hours > 0) {
      return `${hours}t`;
    } else {
      return `${mins}m`;
    }
  };

  const days = getDaysInMonth();
  const dayNames = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vælg dato og tid</h2>
        <p className="text-gray-600">
          Vælg hvornår du ønsker rengøringen udført (ca. {formatDuration(serviceDuration)})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Vælg dato</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
                {currentMonth.toLocaleDateString('da-DK', { year: 'numeric', month: 'long' })}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="p-2"></div>;
                }
                
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dateStr = date.toISOString().split('T')[0];
                const isAvailable = isDateAvailable(day);
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const availableSlots = getAvailableSlots(dateStr);
                
                return (
                  <button
                    key={day}
                    onClick={() => isAvailable && handleDateSelect(dateStr)}
                    disabled={!isAvailable}
                    className={`
                      p-2 text-sm rounded-lg transition-all relative
                      ${isSelected 
                        ? 'bg-blue-600 text-white' 
                        : isAvailable 
                        ? 'hover:bg-blue-50 text-gray-900' 
                        : 'text-gray-300 cursor-not-allowed'
                      }
                      ${isToday && !isSelected ? 'ring-2 ring-blue-200' : ''}
                    `}
                  >
                    {day}
                    {isAvailable && availableSlots.length > 0 && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded mr-1"></div>
              Valgt
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-blue-200 rounded mr-1"></div>
              I dag
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              Ledige tider
            </div>
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vælg tidspunkt</h3>
          
          {!selectedDate ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Vælg først en dato</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center">
                  <Info className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    {formatDate(selectedDate)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availability[selectedDate]?.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleTimeSelect(slot)}
                    disabled={!slot.available}
                    className={`
                      w-full p-3 rounded-lg border text-left transition-all
                      ${selectedTime === slot.time
                        ? 'border-blue-500 bg-blue-50'
                        : slot.available
                        ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className={`font-medium ${slot.available ? 'text-gray-900' : 'text-gray-400'}`}>
                          {slot.time} - {slot.endTime}
                        </span>
                      </div>
                      
                      {selectedTime === slot.time ? (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      ) : !slot.available ? (
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs">{slot.reason}</span>
                        </div>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>

              {availability[selectedDate]?.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">Ingen ledige tider denne dag</p>
                  <p className="text-sm text-gray-400">Prøv en anden dato</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Summary */}
      {selectedDate && selectedTime && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-green-900">Valgt tidspunkt</p>
              <p className="text-sm text-green-700">
                {formatDate(selectedDate)} kl. {selectedTime} - {selectedDateTime?.endTime}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Booking Notes */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Vigtige oplysninger</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• Vi kommer normalt ±15 minutter fra det aftalte tidspunkt</li>
          <li>• Aflysning skal ske senest 24 timer før</li>
          <li>• Vi arbejder mandag-lørdag (søndage kun efter aftale)</li>
          <li>• Lørdag har kortere åbningstider (8-14)</li>
        </ul>
      </div>
    </div>
  );
};