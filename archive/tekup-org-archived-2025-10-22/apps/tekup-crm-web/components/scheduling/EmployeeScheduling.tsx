'use client';

import React, { useState, useMemo } from 'react';
import { mockTeamMembers } from '../../lib/types/mockData';
import { TeamMember, TeamAvailability, TimeSlot } from '../../lib/types/scheduling';

// Simple SVG icon components
const CalendarIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserGroupIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ExclamationTriangleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CheckCircleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const AdjustmentsIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
  </svg>
);

// Employee scheduling interfaces
interface WorkShift {
  id: string;
  employeeId: string;
  date: Date;
  startTime: string; // "08:00"
  endTime: string; // "16:00"
  shiftType: 'morning' | 'day' | 'evening' | 'night' | 'split';
  status: 'scheduled' | 'confirmed' | 'completed' | 'absent' | 'sick';
  breakDuration: number; // minutes
  location?: string;
  notes?: string;
}

interface TimeOffRequest {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  type: 'vacation' | 'sick' | 'personal' | 'maternity' | 'emergency';
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  approvedBy?: string;
  requestDate: Date;
  daysRequested: number;
}

interface OvertimeRecord {
  id: string;
  employeeId: string;
  date: Date;
  regularHours: number;
  overtimeHours: number;
  reason: string;
  approved: boolean;
  payRate: number;
}

interface EmployeeAvailability {
  employeeId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string;
  endTime: string;
  maxHours?: number;
  preferences: string[];
}

// Mock data for employee scheduling
const mockWorkShifts: WorkShift[] = [
  {
    id: 'shift-001',
    employeeId: 'emp-001',
    date: new Date('2024-09-16'),
    startTime: '08:00',
    endTime: '16:00',
    shiftType: 'day',
    status: 'confirmed',
    breakDuration: 30,
    location: 'Zone Nord',
    notes: 'Kontorrengøring - Danske Bank'
  },
  {
    id: 'shift-002',
    employeeId: 'emp-002',
    date: new Date('2024-09-16'),
    startTime: '09:00',
    endTime: '17:00',
    shiftType: 'day',
    status: 'scheduled',
    breakDuration: 30,
    location: 'Zone Syd'
  },
  {
    id: 'shift-003',
    employeeId: 'emp-003',
    date: new Date('2024-09-16'),
    startTime: '06:00',
    endTime: '14:00',
    shiftType: 'morning',
    status: 'completed',
    breakDuration: 30,
    location: 'Zone Vest',
    notes: 'Tidlig skift - hospitalsrengøring'
  },
  {
    id: 'shift-004',
    employeeId: 'emp-004',
    date: new Date('2024-09-16'),
    startTime: '14:00',
    endTime: '22:00',
    shiftType: 'evening',
    status: 'confirmed',
    breakDuration: 45,
    location: 'Zone Øst'
  },
  {
    id: 'shift-005',
    employeeId: 'emp-001',
    date: new Date('2024-09-17'),
    startTime: '08:00',
    endTime: '18:00',
    shiftType: 'day',
    status: 'scheduled',
    breakDuration: 45,
    notes: 'Overtid - stor kontrakt'
  }
];

const mockTimeOffRequests: TimeOffRequest[] = [
  {
    id: 'to-001',
    employeeId: 'emp-002',
    startDate: new Date('2024-09-20'),
    endDate: new Date('2024-09-22'),
    type: 'vacation',
    status: 'pending',
    reason: 'Familieferie',
    requestDate: new Date('2024-09-10'),
    daysRequested: 3
  },
  {
    id: 'to-002',
    employeeId: 'emp-003',
    startDate: new Date('2024-09-18'),
    endDate: new Date('2024-09-18'),
    type: 'sick',
    status: 'approved',
    reason: 'Influenza',
    requestDate: new Date('2024-09-17'),
    daysRequested: 1,
    approvedBy: 'admin-001'
  }
];

const mockOvertimeRecords: OvertimeRecord[] = [
  {
    id: 'ot-001',
    employeeId: 'emp-001',
    date: new Date('2024-09-15'),
    regularHours: 8,
    overtimeHours: 2,
    reason: 'Stor rengøringskontrakt - deadline',
    approved: true,
    payRate: 275.50
  },
  {
    id: 'ot-002',
    employeeId: 'emp-004',
    date: new Date('2024-09-14'),
    regularHours: 8,
    overtimeHours: 1.5,
    reason: 'Ekstra vinduespudsning',
    approved: false,
    payRate: 245.00
  }
];

export default function EmployeeScheduling() {
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [workShifts, setWorkShifts] = useState<WorkShift[]>(mockWorkShifts);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>(mockTimeOffRequests);
  const [overtimeRecords] = useState<OvertimeRecord[]>(mockOvertimeRecords);
  const [showAddShift, setShowAddShift] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'schedule' | 'timeoff' | 'overtime' | 'availability'>('schedule');

  // Get week start (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(selectedWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const dayNames = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];

  // Filter shifts for current week and employee
  const filteredShifts = useMemo(() => {
    return workShifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      const weekStartTime = weekStart.getTime();
      const weekEndTime = weekStart.getTime() + (7 * 24 * 60 * 60 * 1000);
      
      const dateMatch = shiftDate.getTime() >= weekStartTime && shiftDate.getTime() < weekEndTime;
      const employeeMatch = selectedEmployee === 'all' || shift.employeeId === selectedEmployee;
      
      return dateMatch && employeeMatch;
    });
  }, [workShifts, weekStart, selectedEmployee]);

  // Calculate weekly statistics
  const weeklyStats = useMemo(() => {
    const employeeStats = mockTeamMembers.map(employee => {
      const employeeShifts = filteredShifts.filter(shift => shift.employeeId === employee.id);
      const totalHours = employeeShifts.reduce((sum, shift) => {
        const start = new Date(`2000-01-01T${shift.startTime}`);
        const end = new Date(`2000-01-01T${shift.endTime}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + hours - (shift.breakDuration / 60);
      }, 0);
      
      const overtime = employeeShifts.reduce((sum, shift) => {
        const start = new Date(`2000-01-01T${shift.startTime}`);
        const end = new Date(`2000-01-01T${shift.endTime}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60) - (shift.breakDuration / 60);
        return sum + Math.max(0, hours - 8);
      }, 0);

      return {
        employee,
        shifts: employeeShifts.length,
        totalHours: Math.round(totalHours * 10) / 10,
        overtime: Math.round(overtime * 10) / 10,
        status: employeeShifts.some(s => s.status === 'absent' || s.status === 'sick') ? 'attention' : 'good'
      };
    });

    return employeeStats;
  }, [filteredShifts]);

  const getShiftStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'sick': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'morning': return 'bg-orange-50 border-l-orange-400';
      case 'day': return 'bg-blue-50 border-l-blue-400';
      case 'evening': return 'bg-purple-50 border-l-purple-400';
      case 'night': return 'bg-indigo-50 border-l-indigo-400';
      case 'split': return 'bg-pink-50 border-l-pink-400';
      default: return 'bg-gray-50 border-l-gray-400';
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds if present
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = mockTeamMembers.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Ukendt medarbejder';
  };

  const calculateShiftDuration = (startTime: string, endTime: string, breakDuration: number) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const workMinutes = totalMinutes - breakDuration;
    return Math.round(workMinutes / 60 * 10) / 10; // Hours with 1 decimal
  };

  const handleApproveTimeOff = (requestId: string) => {
    setTimeOffRequests(prev => prev.map(request => 
      request.id === requestId 
        ? { ...request, status: 'approved' as const, approvedBy: 'current-user' }
        : request
    ));
  };

  const handleRejectTimeOff = (requestId: string) => {
    setTimeOffRequests(prev => prev.map(request => 
      request.id === requestId 
        ? { ...request, status: 'rejected' as const }
        : request
    ));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Medarbejderplanlægning
            </h1>
            <p className="text-gray-600">
              Vagtplan, fravær og overtid administration for rengøringsteam
            </p>
          </div>
          
          <button
            onClick={() => setShowAddShift(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Tilføj vagt
          </button>
        </div>

        {/* View Tabs */}
        <div className="bg-white rounded-lg shadow-lg p-1 mb-6 flex space-x-1 max-w-2xl">
          {[
            { id: 'schedule', name: 'Vagtplan', icon: '📅' },
            { id: 'timeoff', name: 'Fravær', icon: '🏖️' },
            { id: 'overtime', name: 'Overtid', icon: '⏰' },
            { id: 'availability', name: 'Tilgængelighed', icon: '📋' }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeView === view.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {view.icon} {view.name}
            </button>
          ))}
        </div>

        {activeView === 'schedule' && (
          <>
            {/* Week Navigation & Filters */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      const newWeek = new Date(selectedWeek);
                      newWeek.setDate(selectedWeek.getDate() - 7);
                      setSelectedWeek(newWeek);
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    ←
                  </button>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Uge {weekStart.toLocaleDateString('da-DK', { 
                        day: 'numeric', 
                        month: 'short' 
                      })} - {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('da-DK', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {weekStart.getFullYear()}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      const newWeek = new Date(selectedWeek);
                      newWeek.setDate(selectedWeek.getDate() + 7);
                      setSelectedWeek(newWeek);
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    →
                  </button>
                </div>

                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Alle medarbejdere</option>
                  {mockTeamMembers.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weekly Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Total vagter</p>
                      <p className="text-2xl font-semibold text-blue-900">{filteredShifts.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <ClockIcon className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Total timer</p>
                      <p className="text-2xl font-semibold text-green-900">
                        {weeklyStats.reduce((sum, stat) => sum + stat.totalHours, 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-900">Overtid</p>
                      <p className="text-2xl font-semibold text-yellow-900">
                        {weeklyStats.reduce((sum, stat) => sum + stat.overtime, 0)}t
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-8 w-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-900">Fravær</p>
                      <p className="text-2xl font-semibold text-red-900">
                        {filteredShifts.filter(s => s.status === 'absent' || s.status === 'sick').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Schedule Grid */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-0 min-w-full">
                  {/* Header */}
                  <div className="bg-gray-50 p-4 border-b border-gray-200 font-medium text-gray-900">
                    Medarbejder
                  </div>
                  {weekDays.map((day, index) => (
                    <div key={day.toISOString()} className="bg-gray-50 p-4 border-b border-gray-200">
                      <div className="text-sm font-medium text-gray-900">
                        {dayNames[index]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {day.getDate()}/{day.getMonth() + 1}
                      </div>
                    </div>
                  ))}

                  {/* Schedule Rows */}
                  {weeklyStats.map((employeeStat) => (
                    <React.Fragment key={employeeStat.employee.id}>
                      {/* Employee Info */}
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="font-medium text-gray-900">
                          {employeeStat.employee.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employeeStat.totalHours}t denne uge
                        </div>
                        {employeeStat.overtime > 0 && (
                          <div className="text-xs text-yellow-600">
                            +{employeeStat.overtime}t overtid
                          </div>
                        )}
                      </div>

                      {/* Daily Shifts */}
                      {weekDays.map((day) => {
                        const dayShifts = filteredShifts.filter(shift => 
                          shift.employeeId === employeeStat.employee.id &&
                          new Date(shift.date).toDateString() === day.toDateString()
                        );

                        return (
                          <div key={`${employeeStat.employee.id}-${day.toISOString()}`} 
                               className="p-2 border-b border-gray-200 min-h-[120px]">
                            {dayShifts.map((shift) => (
                              <div
                                key={shift.id}
                                className={`mb-2 p-2 rounded border-l-4 ${getShiftTypeColor(shift.shiftType)}`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-medium text-gray-900">
                                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full border ${getShiftStatusColor(shift.status)}`}>
                                    {shift.status === 'confirmed' && 'Bekræftet'}
                                    {shift.status === 'scheduled' && 'Planlagt'}
                                    {shift.status === 'completed' && 'Afsluttet'}
                                    {shift.status === 'absent' && 'Fraværende'}
                                    {shift.status === 'sick' && 'Syg'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">
                                  {calculateShiftDuration(shift.startTime, shift.endTime, shift.breakDuration)}t
                                  {shift.location && ` • ${shift.location}`}
                                </div>
                                {shift.notes && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {shift.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeView === 'timeoff' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Fraværsanmodninger
              </h3>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Ny anmodning
              </button>
            </div>

            <div className="space-y-4">
              {timeOffRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {getEmployeeName(request.employeeId)}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'pending' && 'Afventer'}
                          {request.status === 'approved' && 'Godkendt'}
                          {request.status === 'rejected' && 'Afvist'}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {request.type === 'vacation' && '🏖️ Ferie'}
                          {request.type === 'sick' && '🤒 Syg'}
                          {request.type === 'personal' && '👤 Personlig'}
                          {request.type === 'maternity' && '👶 Barsel'}
                          {request.type === 'emergency' && '🚨 Nød'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Periode:</strong> {request.startDate.toLocaleDateString('da-DK')} - {request.endDate.toLocaleDateString('da-DK')}
                        <span className="ml-2">({request.daysRequested} dag{request.daysRequested !== 1 ? 'e' : ''})</span>
                      </div>
                      
                      {request.reason && (
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Begrundelse:</strong> {request.reason}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Anmodet: {request.requestDate.toLocaleDateString('da-DK')}
                        {request.approvedBy && ` • Godkendt af: ${request.approvedBy}`}
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleApproveTimeOff(request.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Godkend
                        </button>
                        <button
                          onClick={() => handleRejectTimeOff(request.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Afvis
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'overtime' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Overtidsregistrering
              </h3>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Registrer overtid
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medarbejder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Begrundelse
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beløb
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {overtimeRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getEmployeeName(record.employeeId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.date.toLocaleDateString('da-DK')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>Normal: {record.regularHours}t</div>
                        <div className="text-yellow-600">Overtid: {record.overtimeHours}t</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {record.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.overtimeHours * record.payRate * 1.5)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.approved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.approved ? 'Godkendt' : 'Afventer'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'availability' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Medarbejdertilgængelighed
              </h3>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
                <AdjustmentsIcon className="h-5 w-5 mr-2" />
                Rediger tilgængelighed
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTeamMembers.map((employee) => (
                <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {employee.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{employee.name}</h4>
                      <p className="text-sm text-gray-500">{employee.role}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Ugentlig tilgængelighed:</h5>
                    {dayNames.map((day, index) => {
                      const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index] as keyof TeamAvailability;
                      const dayAvailability = employee.availability[dayKey] as TimeSlot[];
                      const availableSlots = dayAvailability.filter(slot => slot.available);
                      
                      return (
                        <div key={day} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{day}:</span>
                          <span className="text-gray-900">
                            {availableSlots.length > 0 
                              ? `${availableSlots[0].start} - ${availableSlots[availableSlots.length - 1].end}`
                              : 'Ikke tilgængelig'
                            }
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max timer/uge:</span>
                        <span className="text-gray-900">37t</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Præferencer:</span>
                        <span className="text-gray-900">Dagvagt</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}