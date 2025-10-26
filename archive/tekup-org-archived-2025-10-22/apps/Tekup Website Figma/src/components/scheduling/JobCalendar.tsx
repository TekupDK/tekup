'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, Clock, MapPin, Users, Plus, Filter, Search, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, isToday, addDays } from 'date-fns';
import { da } from 'date-fns/locale';

interface CleaningJob {
  id: string;
  title: string;
  customer: string;
  address: string;
  startTime: Date;
  duration: number; // minutes
  team: string[];
  jobType: 'kontorrenhold' | 'privat' | 'specialrengøring' | 'vinduespolering';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  recurring: boolean;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  estimatedRevenue: number;
}

interface JobCalendarProps {
  onJobClick?: (job: CleaningJob) => void;
  onNewJob?: () => void;
}

export function JobCalendar({ onJobClick, onNewJob }: JobCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [isLoading, setIsLoading] = useState(false);

  // Mock cleaning jobs with realistic Danish data
  const [jobs, setJobs] = useState<CleaningJob[]>([
    {
      id: '1',
      title: 'Ugentlig kontorrenhold',
      customer: 'Køpenhavns Advokatfirma',
      address: 'Kongens Nytorv 15, 1050 København K',
      startTime: new Date(2024, 11, 16, 8, 0), // Monday 8:00
      duration: 180, // 3 hours
      team: ['Maria Hansen', 'Peter Nielsen'],
      jobType: 'kontorrenhold',
      status: 'scheduled',
      recurring: true,
      priority: 'medium',
      estimatedRevenue: 3200,
      notes: 'Husk ekstra toiletpapir og sæbe'
    },
    {
      id: '2',
      title: 'Privat hovedrengøring',
      customer: 'Caja og Torben Madsen',
      address: 'Strandvejen 45, 2900 Hellerup',
      startTime: new Date(2024, 11, 16, 14, 0), // Monday 14:00
      duration: 240, // 4 hours
      team: ['Anna Larsen', 'Mette Sørensen'],
      jobType: 'privat',
      status: 'scheduled',
      recurring: false,
      priority: 'high',
      estimatedRevenue: 4500,
      notes: 'Hund i hjemmet - vær forsigtig med døre'
    },
    {
      id: '3',
      title: 'Restaurant dybderengøring',
      customer: 'Restaurant Noma',
      address: 'Refshalevej 96, 1432 København K',
      startTime: new Date(2024, 11, 17, 6, 0), // Tuesday 6:00
      duration: 480, // 8 hours
      team: ['Lars Kristensen', 'Ida Thomsen', 'Jonas Andersen'],
      jobType: 'specialrengøring',
      status: 'scheduled',
      recurring: false,
      priority: 'high',
      estimatedRevenue: 12000,
      notes: 'Kræver food safety certificering - tag specialudstyr'
    },
    {
      id: '4',
      title: 'Vinduespolering',
      customer: 'Danske Bank Hovedkontor',
      address: 'Holmens Kanal 2-12, 1092 København K',
      startTime: new Date(2024, 11, 18, 9, 0), // Wednesday 9:00
      duration: 360, // 6 hours
      team: ['Michael Olsen', 'Søren Pedersen'],
      jobType: 'vinduespolering',
      status: 'scheduled',
      recurring: true,
      priority: 'medium',
      estimatedRevenue: 8500,
      notes: 'Høje vinduer - sikkerhedsudstyr påkrævet'
    },
    {
      id: '5',
      title: 'Akut kontorrengøring',
      customer: 'TechStart ApS',
      address: 'Øster Allé 42, 2100 København Ø',
      startTime: new Date(2024, 11, 19, 16, 0), // Thursday 16:00
      duration: 120, // 2 hours
      team: ['Emma Jensen'],
      jobType: 'kontorrenhold',
      status: 'in_progress',
      recurring: false,
      priority: 'high',
      estimatedRevenue: 1800,
      notes: 'Vigtig kunde - levér perfekt resultat'
    }
  ]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getJobsForDate = (date: Date) => {
    return jobs.filter(job => isSameDay(new Date(job.startTime), date));
  };

  const getJobTypeColor = (type: CleaningJob['jobType']) => {
    switch (type) {
      case 'kontorrenhold': return 'bg-blue-500';
      case 'privat': return 'bg-green-500';
      case 'specialrengøring': return 'bg-purple-500';
      case 'vinduespolering': return 'bg-cyan-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: CleaningJob['status']) => {
    switch (status) {
      case 'scheduled': return 'border-l-blue-500';
      case 'in_progress': return 'border-l-yellow-500';
      case 'completed': return 'border-l-green-500';
      case 'cancelled': return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  const getPriorityIcon = (priority: CleaningJob['priority']) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const filteredJobs = filterType === 'all' ? jobs : jobs.filter(job => job.jobType === filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Job Kalender</h2>
          <p className="text-gray-300">
            Planlæg og administrer rengøringsopgaver for dit team
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
              className={viewMode === 'week' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }
            >
              Uge
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
              className={viewMode === 'day' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }
            >
              Dag
            </Button>
          </div>
          
          <Button
            onClick={onNewJob}
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nyt Job
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <h3 className="text-lg font-semibold text-white">
                Uge {format(currentWeek, 'w', { locale: da })} - {format(weekStart, 'MMM yyyy', { locale: da })}
              </h3>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="text-white hover:bg-white/10"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">Alle job typer</option>
                <option value="kontorrenhold">Kontorrenhold</option>
                <option value="privat">Privat renhold</option>
                <option value="specialrengøring">Specialrengøring</option>
                <option value="vinduespolering">Vinduespolering</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {viewMode === 'week' ? (
            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day) => {
                const dayJobs = getJobsForDate(day).filter(job => 
                  filterType === 'all' || job.jobType === filterType
                );
                
                return (
                  <div key={day.toISOString()} className="space-y-2">
                    <div className={`text-center p-2 rounded-lg ${
                      isToday(day) 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                        : 'bg-white/5 text-gray-300'
                    }`}>
                      <div className="text-xs font-medium">
                        {format(day, 'EEE', { locale: da })}
                      </div>
                      <div className="text-lg font-bold">
                        {format(day, 'd')}
                      </div>
                    </div>
                    
                    <div className="space-y-1 min-h-[200px]">
                      {dayJobs.map((job) => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => onJobClick?.(job)}
                          className={`p-2 rounded-lg bg-white/10 border-l-4 ${getStatusColor(job.status)} cursor-pointer hover:bg-white/20 transition-colors`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white">
                              {format(new Date(job.startTime), 'HH:mm')}
                            </span>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs">{getPriorityIcon(job.priority)}</span>
                              {job.recurring && <span className="text-xs">🔄</span>}
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-300 mb-1">
                            {job.title}
                          </div>
                          
                          <div className="text-xs text-gray-400 mb-1">
                            {job.customer}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="secondary"
                              className={`${getJobTypeColor(job.jobType)} text-white text-xs px-1 py-0`}
                            >
                              {job.jobType}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {job.duration}min
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Day view
            <div className="space-y-4">
              {selectedDate ? (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: da })}
                  </h3>
                  
                  {getJobsForDate(selectedDate).map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/10 rounded-lg p-4 mb-4 cursor-pointer hover:bg-white/20 transition-colors"
                      onClick={() => onJobClick?.(job)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={`${getJobTypeColor(job.jobType)} text-white`}>
                              {job.jobType}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {getPriorityIcon(job.priority)} {job.priority}
                            </span>
                            {job.recurring && <span className="text-sm text-cyan-400">🔄 Tilbagevendende</span>}
                          </div>
                          
                          <h4 className="text-lg font-semibold text-white mb-1">{job.title}</h4>
                          <p className="text-gray-300 mb-2">{job.customer}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{format(new Date(job.startTime), 'HH:mm')} ({job.duration} min)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{job.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>{job.team.join(', ')}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span>💰</span>
                              <span>{job.estimatedRevenue.toLocaleString('da-DK')} kr</span>
                            </div>
                          </div>
                          
                          {job.notes && (
                            <div className="mt-3 p-2 bg-yellow-500/20 rounded text-sm text-yellow-200">
                              📝 {job.notes}
                            </div>
                          )}
                        </div>
                        
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Vælg en dag fra kalenderen for at se jobs</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300">Jobs i dag</p>
                <p className="text-2xl font-bold text-white">
                  {getJobsForDate(new Date()).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300">Ugens omsætning</p>
                <p className="text-2xl font-bold text-white">
                  {filteredJobs.reduce((sum, job) => sum + job.estimatedRevenue, 0).toLocaleString('da-DK')} kr
                </p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300">Aktive teams</p>
                <p className="text-2xl font-bold text-white">
                  {new Set(filteredJobs.flatMap(job => job.team)).size}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-300">Gennemsnit tid</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round(filteredJobs.reduce((sum, job) => sum + job.duration, 0) / filteredJobs.length / 60 * 10) / 10}t
                </p>
              </div>
              <Clock className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}