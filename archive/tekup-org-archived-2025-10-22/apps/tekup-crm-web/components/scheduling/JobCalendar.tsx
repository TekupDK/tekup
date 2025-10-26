'use client';

import React, { useState, useMemo } from 'react';
import { 
  CalendarDaysIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import { CleaningJob, CalendarEvent, JobStatus } from '../../lib/types/scheduling';
import { mockCleaningJobs, mockCalendarEvents } from '../../lib/types/mockData';

// Danske måneder og ugedage
const DANISH_MONTHS = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December'
];

const DANISH_WEEKDAYS = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
const DANISH_WEEKDAYS_FULL = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

// Utility functions for Danish formatting
const formatDanishDate = (date: Date): string => {
  const day = date.getDate();
  const month = DANISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const weekday = DANISH_WEEKDAYS_FULL[date.getDay()];
  return `${weekday} ${day}. ${month} ${year}`;
};

const formatDanishTime = (date: Date): string => {
  return date.toLocaleTimeString('da-DK', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

// Job status styling
const getJobStatusStyle = (status: JobStatus) => {
  const styles = {
    scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200', 
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    no_show: 'bg-gray-100 text-gray-800 border-gray-200',
    rescheduled: 'bg-orange-100 text-orange-800 border-orange-200',
    paused: 'bg-purple-100 text-purple-800 border-purple-200'
  };
  return styles[status] || styles.scheduled;
};

const getJobStatusText = (status: JobStatus): string => {
  const statusTexts = {
    scheduled: 'Planlagt',
    confirmed: 'Bekræftet',
    in_progress: 'I gang',
    completed: 'Færdig',
    cancelled: 'Aflyst',
    no_show: 'Ikke mødt',
    rescheduled: 'Omplanlagt',
    paused: 'Pauseret'
  };
  return statusTexts[status] || status;
};

const getJobTypeText = (jobType: string): string => {
  const jobTypeTexts: Record<string, string> = {
    'kontorrenhold': 'Kontorrenhold',
    'privatrenhold': 'Privatrenhold',
    'flytterenhold': 'Flytterenhold',
    'byggerenhold': 'Byggerenhold',
    'vinduespudsning': 'Vinduespudsning',
    'tæpperens': 'Tæpperens',
    'specialrengøring': 'Specialrengøring',
    'vedligeholdelse': 'Vedligeholdelse',
    'dybrengøring': 'Dybrengøring',
    'akutrengøring': 'Akutrengøring'
  };
  return jobTypeTexts[jobType] || jobType;
};

interface JobCalendarProps {
  jobs?: CleaningJob[];
  onJobClick?: (job: CleaningJob) => void;
  onDateChange?: (date: Date) => void;
  className?: string;
}

export default function JobCalendar({ 
  jobs = mockCleaningJobs, 
  onJobClick,
  onDateChange,
  className = ''
}: JobCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Kalender navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const days = direction === 'prev' ? -7 : 7;
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const days = direction === 'prev' ? -1 : 1;
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'month':
        navigateMonth(direction);
        break;
      case 'week':
        navigateWeek(direction);
        break;
      case 'day':
        navigateDay(direction);
        break;
    }
  };

  // Få jobs for en specifik dato
  const getJobsForDate = (date: Date): CleaningJob[] => {
    return jobs.filter(job => {
      const jobDate = new Date(job.scheduledDate);
      return jobDate.toDateString() === date.toDateString();
    });
  };

  // Generér månedsdage
  const generateMonthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Start fra mandag (dansk standard)
    const dayOfWeek = (firstDay.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 uger x 7 dage
      const isCurrentMonth = currentDay.getMonth() === month;
      const isToday = currentDay.toDateString() === new Date().toDateString();
      const dayJobs = getJobsForDate(currentDay);
      
      days.push({
        date: new Date(currentDay),
        isCurrentMonth,
        isToday,
        jobs: dayJobs,
        jobCount: dayJobs.length
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  }, [currentDate, jobs]);

  // Generér uge dage
  const generateWeekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Mandag som start
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      const isToday = currentDay.toDateString() === new Date().toDateString();
      const dayJobs = getJobsForDate(currentDay);

      days.push({
        date: new Date(currentDay),
        isToday,
        jobs: dayJobs,
        jobCount: dayJobs.length
      });
    }

    return days;
  }, [currentDate, jobs]);

  // Få jobs for den valgte dag
  const selectedDayJobs = selectedDate ? getJobsForDate(selectedDate) : getJobsForDate(currentDate);

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Rengøringskalender
          </h2>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  view === viewType
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {viewType === 'month' && 'Måned'}
                {viewType === 'week' && 'Uge'}
                {viewType === 'day' && 'Dag'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => handleNavigation('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {view === 'month' && `${DANISH_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {view === 'week' && `Uge ${getWeekNumber(currentDate)}, ${currentDate.getFullYear()}`}
            {view === 'day' && formatDanishDate(currentDate)}
          </h3>
        </div>

        <button
          onClick={() => handleNavigation('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {view === 'month' && (
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday Headers */}
            {DANISH_WEEKDAYS.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Month Days */}
            {generateMonthDays.map((day, index) => (
              <div
                key={index}
                onClick={() => setSelectedDate(day.date)}
                className={`
                  min-h-[80px] p-2 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors
                  ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                  ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
                  ${selectedDate?.toDateString() === day.date.toDateString() ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                <div className="text-sm font-medium mb-1">
                  {day.date.getDate()}
                </div>
                
                {day.jobs.slice(0, 2).map((job) => (
                  <div
                    key={job.id}
                    className="text-xs p-1 mb-1 rounded truncate"
                    style={{ backgroundColor: getJobTypeColor(job.jobType) + '20', color: getJobTypeColor(job.jobType) }}
                  >
                    {formatDanishTime(job.scheduledDate)} {job.customer.name}
                  </div>
                ))}
                
                {day.jobCount > 2 && (
                  <div className="text-xs text-gray-500">
                    +{day.jobCount - 2} flere
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {view === 'week' && (
          <div className="grid grid-cols-7 gap-4">
            {generateWeekDays.map((day, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className={`text-center mb-3 ${day.isToday ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
                  <div className="text-sm">{DANISH_WEEKDAYS[day.date.getDay()]}</div>
                  <div className="text-lg">{day.date.getDate()}</div>
                </div>
                
                <div className="space-y-2">
                  {day.jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => onJobClick?.(job)}
                      className="text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: getJobTypeColor(job.jobType) + '20', color: getJobTypeColor(job.jobType) }}
                    >
                      <div className="font-medium">{formatDanishTime(job.scheduledDate)}</div>
                      <div className="truncate">{job.customer.name}</div>
                      <div className="truncate">{getJobTypeText(job.jobType)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'day' && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900">
                {formatDanishDate(currentDate)}
              </h4>
              <p className="text-sm text-gray-600">
                {selectedDayJobs.length} job{selectedDayJobs.length !== 1 ? 's' : ''} i dag
              </p>
            </div>

            <div className="space-y-3">
              {selectedDayJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen jobs planlagt for denne dag</p>
                </div>
              ) : (
                selectedDayJobs.map((job) => (
                  <JobCard key={job.id} job={job} onClick={() => onJobClick?.(job)} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Date Details */}
      {selectedDate && view === 'month' && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            Jobs for {formatDanishDate(selectedDate)}
          </h4>
          
          {getJobsForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500">Ingen jobs planlagt for denne dag</p>
          ) : (
            <div className="space-y-3">
              {getJobsForDate(selectedDate).map((job) => (
                <JobCard key={job.id} job={job} onClick={() => onJobClick?.(job)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Job Card Component
interface JobCardProps {
  job: CleaningJob;
  onClick?: () => void;
}

function JobCard({ job, onClick }: JobCardProps) {
  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h5 className="font-semibold text-gray-900">{job.title}</h5>
          <p className="text-sm text-gray-600">{job.customer.name}</p>
        </div>
        
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getJobStatusStyle(job.status)}`}>
          {getJobStatusText(job.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-2" />
          {formatDanishTime(job.scheduledDate)} ({job.estimatedDuration} min)
        </div>
        
        <div className="flex items-center">
          <UserGroupIcon className="h-4 w-4 mr-2" />
          {job.teamMembers.length} medarbejder{job.teamMembers.length !== 1 ? 'e' : ''}
        </div>
        
        <div className="flex items-center">
          <MapPinIcon className="h-4 w-4 mr-2" />
          {job.location.city}
        </div>
        
        <div className="flex items-center">
          <span className="font-medium text-green-600">
            {job.cost.total.toLocaleString('da-DK')} DKK
          </span>
        </div>
      </div>

      {job.specialRequirements && job.specialRequirements.length > 0 && (
        <div className="mt-3 flex items-center text-sm text-amber-600">
          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
          Særlige krav
        </div>
      )}
    </div>
  );
}

// Utility functions
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getJobTypeColor(jobType: string): string {
  const colors: Record<string, string> = {
    'kontorrenhold': '#3B82F6',     // blå
    'privatrenhold': '#10B981',     // grøn
    'flytterenhold': '#F59E0B',     // orange
    'byggerenhold': '#EF4444',      // rød
    'vinduespudsning': '#8B5CF6',   // lilla
    'tæpperens': '#06B6D4',         // cyan
    'specialrengøring': '#EC4899',  // pink
    'vedligeholdelse': '#84CC16',   // lime
    'dybrengøring': '#F97316',      // orange-rød
    'akutrengøring': '#DC2626'      // mørk rød
  };
  return colors[jobType] || '#6B7280';
}