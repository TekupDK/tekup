'use client';

import React, { useState, useMemo } from 'react';
import { 
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

import { TeamMember, CleaningJob, TimeSlot } from '../../lib/types/scheduling';
import { mockTeamMembers, mockCleaningJobs } from '../../lib/types/mockData';

// Danske ugedage
const DANISH_WEEKDAYS_FULL = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
const DANISH_WEEKDAYS_SHORT = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];

interface TeamScheduleProps {
  teamMembers?: TeamMember[];
  jobs?: CleaningJob[];
  selectedDate?: Date;
  onJobAssign?: (job: CleaningJob, teamMember: TeamMember) => void;
  onScheduleChange?: (teamMember: TeamMember, day: string, timeSlot: TimeSlot) => void;
  className?: string;
}

export default function TeamSchedule({
  teamMembers = mockTeamMembers,
  jobs = mockCleaningJobs,
  selectedDate = new Date(),
  onJobAssign,
  onScheduleChange,
  className = ''
}: TeamScheduleProps) {
  const [view, setView] = useState<'week' | 'day'>('week');
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);

  // Generér uge baseret på selectedDate
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Mandag som start
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      days.push(currentDay);
    }
    return days;
  }, [selectedDate]);

  // Få jobs for en specifik medarbejder på en specifik dato
  const getJobsForTeamMemberAndDate = (teamMemberId: string, date: Date): CleaningJob[] => {
    return jobs.filter(job => {
      const jobDate = new Date(job.scheduledDate);
      const isCorrectDate = jobDate.toDateString() === date.toDateString();
      const isAssignedToMember = job.teamMembers.some(member => member.id === teamMemberId);
      return isCorrectDate && isAssignedToMember;
    });
  };

  // Beregn arbejdstimer for en medarbejder på en dag
  const calculateWorkingHours = (teamMemberId: string, date: Date): { 
    scheduledHours: number, 
    actualHours: number,
    efficiency: number 
  } => {
    const memberJobs = getJobsForTeamMemberAndDate(teamMemberId, date);
    
    const scheduledMinutes = memberJobs.reduce((total, job) => total + job.estimatedDuration, 0);
    const actualMinutes = memberJobs.reduce((total, job) => total + (job.actualDuration || job.estimatedDuration), 0);
    
    const scheduledHours = scheduledMinutes / 60;
    const actualHours = actualMinutes / 60;
    const efficiency = actualMinutes > 0 ? (scheduledMinutes / actualMinutes) * 100 : 100;

    return { scheduledHours, actualHours, efficiency };
  };

  // Tjek om en medarbejder er tilgængelig på et specifikt tidspunkt
  const isTeamMemberAvailable = (teamMember: TeamMember, date: Date, time: string): boolean => {
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const availability = teamMember.availability[dayName as keyof typeof teamMember.availability];
    
    if (!availability || availability.length === 0) return false;

    return availability.some(slot => {
      return slot.available && time >= slot.start && time <= slot.end;
    });
  };

  // Format tid til dansk format
  const formatTime = (time: string): string => {
    return time.substring(0, 5); // "09:00" format
  };

  // Få farve baseret på job status eller belastning
  const getStatusColor = (status: string): string => {
    const colors = {
      available: 'bg-green-100 border-green-300 text-green-800',
      busy: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      overbooked: 'bg-red-100 border-red-300 text-red-800',
      unavailable: 'bg-gray-100 border-gray-300 text-gray-600'
    };
    return colors[status as keyof typeof colors] || colors.available;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <UserGroupIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Team Planlægning
          </h2>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['week', 'day'] as const).map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  view === viewType
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {viewType === 'week' && 'Uge'}
                {viewType === 'day' && 'Dag'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team Overview Stats */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{teamMembers.length}</div>
            <div className="text-sm text-gray-600">Medarbejdere</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {teamMembers.filter(member => {
                const todayJobs = getJobsForTeamMemberAndDate(member.id, new Date());
                return todayJobs.length > 0;
              }).length}
            </div>
            <div className="text-sm text-gray-600">Aktive i dag</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {jobs.filter(job => {
                const jobDate = new Date(job.scheduledDate);
                return jobDate.toDateString() === new Date().toDateString();
              }).length}
            </div>
            <div className="text-sm text-gray-600">Jobs i dag</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(teamMembers.reduce((avg, member) => {
                const { efficiency } = calculateWorkingHours(member.id, new Date());
                return avg + efficiency;
              }, 0) / teamMembers.length)}%
            </div>
            <div className="text-sm text-gray-600">Gennemsnit effektivitet</div>
          </div>
        </div>
      </div>

      {/* Team Schedule Grid */}
      <div className="p-4">
        {view === 'week' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 bg-gray-50 sticky left-0 z-10">
                    Medarbejder
                  </th>
                  {weekDays.map((day, index) => (
                    <th key={index} className="text-center py-3 px-4 font-medium text-gray-900 bg-gray-50 min-w-[150px]">
                      <div>{DANISH_WEEKDAYS_SHORT[day.getDay()]}</div>
                      <div className="text-sm font-normal text-gray-600">
                        {day.getDate()}/{day.getMonth() + 1}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-t border-gray-200">
                    <td className="py-4 px-4 bg-white sticky left-0 z-10 border-r border-gray-200">
                      <TeamMemberCell member={member} />
                    </td>
                    {weekDays.map((day, dayIndex) => {
                      const memberJobs = getJobsForTeamMemberAndDate(member.id, day);
                      const { scheduledHours, efficiency } = calculateWorkingHours(member.id, day);
                      
                      return (
                        <td key={dayIndex} className="py-4 px-2 text-center align-top">
                          <DayScheduleCell
                            teamMember={member}
                            date={day}
                            jobs={memberJobs}
                            scheduledHours={scheduledHours}
                            efficiency={efficiency}
                            onJobClick={(job) => console.log('Job clicked:', job)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'day' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {DANISH_WEEKDAYS_FULL[selectedDate.getDay()]} {selectedDate.getDate()}.{selectedDate.getMonth() + 1}.{selectedDate.getFullYear()}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => {
                const memberJobs = getJobsForTeamMemberAndDate(member.id, selectedDate);
                const { scheduledHours, efficiency } = calculateWorkingHours(member.id, selectedDate);
                
                return (
                  <DayDetailCard
                    key={member.id}
                    teamMember={member}
                    date={selectedDate}
                    jobs={memberJobs}
                    scheduledHours={scheduledHours}
                    efficiency={efficiency}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Team Member Cell Component
interface TeamMemberCellProps {
  member: TeamMember;
}

function TeamMemberCell({ member }: TeamMemberCellProps) {
  const roleText = {
    'team_leader': 'Teamleder',
    'cleaner': 'Rengøringsassistent',
    'specialist': 'Specialist',
    'trainee': 'Praktikant'
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-sm font-medium text-blue-600">
          {member.name.split(' ').map(n => n[0]).join('')}
        </span>
      </div>
      <div>
        <div className="font-medium text-gray-900">{member.name}</div>
        <div className="text-sm text-gray-600">{roleText[member.role]}</div>
        <div className="text-xs text-gray-500">{member.hourlyRate} DKK/time</div>
      </div>
    </div>
  );
}

// Day Schedule Cell Component
interface DayScheduleCellProps {
  teamMember: TeamMember;
  date: Date;
  jobs: CleaningJob[];
  scheduledHours: number;
  efficiency: number;
  onJobClick: (job: CleaningJob) => void;
}

function DayScheduleCell({ 
  teamMember, 
  date, 
  jobs, 
  scheduledHours, 
  efficiency,
  onJobClick 
}: DayScheduleCellProps) {
  const getWorkloadStatus = () => {
    if (jobs.length === 0) return 'available';
    if (scheduledHours > 8) return 'overbooked';
    if (scheduledHours > 6) return 'busy';
    return 'available';
  };

  const status = getWorkloadStatus();

  return (
    <div className={`min-h-[120px] p-2 rounded-lg border-2 ${getStatusColor(status)}`}>
      {jobs.length === 0 ? (
        <div className="text-center text-sm">
          <div className="mb-1">Ledig</div>
          <div className="text-xs">0 timer</div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-xs font-medium">
            {scheduledHours.toFixed(1)}t | {efficiency.toFixed(0)}%
          </div>
          
          {jobs.slice(0, 2).map((job) => (
            <div
              key={job.id}
              onClick={() => onJobClick(job)}
              className="text-xs p-1 bg-white rounded cursor-pointer hover:bg-gray-50 truncate"
              title={`${job.customer.name} - ${job.title}`}
            >
              <div className="font-medium">{formatTime(job.scheduledTime)}</div>
              <div className="truncate">{job.customer.name}</div>
            </div>
          ))}
          
          {jobs.length > 2 && (
            <div className="text-xs text-center text-gray-600">
              +{jobs.length - 2} flere
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Day Detail Card Component for day view
interface DayDetailCardProps {
  teamMember: TeamMember;
  date: Date;
  jobs: CleaningJob[];
  scheduledHours: number;
  efficiency: number;
}

function DayDetailCard({ teamMember, date, jobs, scheduledHours, efficiency }: DayDetailCardProps) {
  const roleText = {
    'team_leader': 'Teamleder',
    'cleaner': 'Rengøringsassistent', 
    'specialist': 'Specialist',
    'trainee': 'Praktikant'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {teamMember.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{teamMember.name}</div>
            <div className="text-sm text-gray-600">{roleText[teamMember.role]}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{scheduledHours.toFixed(1)} timer</div>
          <div className="text-xs text-gray-600">{efficiency.toFixed(0)}% effektivitet</div>
        </div>
      </div>

      <div className="space-y-2">
        {jobs.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <CalendarDaysIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Ingen jobs planlagt</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="border border-gray-100 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{formatTime(job.scheduledTime)}</span>
                <span className="text-xs text-gray-500">{job.estimatedDuration} min</span>
              </div>
              <div className="text-sm text-gray-900">{job.customer.name}</div>
              <div className="text-xs text-gray-600 flex items-center">
                <MapPinIcon className="h-3 w-3 mr-1" />
                {job.location.city}
              </div>
            </div>
          ))
        )}
      </div>

      {jobs.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Estimeret indtjening:</span>
            <span className="font-medium text-green-600">
              {Math.round(scheduledHours * teamMember.hourlyRate).toLocaleString('da-DK')} DKK
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function for time formatting
function formatTime(time: string): string {
  return time.substring(0, 5);
}

// Status color utility
function getStatusColor(status: string): string {
  const colors = {
    available: 'bg-green-100 border-green-300 text-green-800',
    busy: 'bg-yellow-100 border-yellow-300 text-yellow-800', 
    overbooked: 'bg-red-100 border-red-300 text-red-800',
    unavailable: 'bg-gray-100 border-gray-300 text-gray-600'
  };
  return colors[status as keyof typeof colors] || colors.available;
}