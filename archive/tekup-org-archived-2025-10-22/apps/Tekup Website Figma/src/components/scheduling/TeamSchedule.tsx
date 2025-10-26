'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Users, Clock, MapPin, Phone, Mail, Calendar, Plus, Filter, AlertTriangle, CheckCircle2, Car } from 'lucide-react';
import { format, addDays, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay } from 'date-fns';
import { da } from 'date-fns/locale';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'team_leader' | 'cleaner' | 'specialist';
  avatar?: string;
  skills: string[];
  availability: 'available' | 'busy' | 'off';
  location?: string;
  vehicle?: string;
  certification: string[];
}

interface TeamScheduleEntry {
  id: string;
  memberId: string;
  date: Date;
  startTime: string;
  endTime: string;
  jobId: string;
  jobTitle: string;
  customer: string;
  address: string;
  jobType: 'kontorrenhold' | 'privat' | 'specialrengøring' | 'vinduespolering';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

interface TeamScheduleProps {
  onAssignJob?: (memberId: string, jobId: string) => void;
  onUpdateSchedule?: (entry: TeamScheduleEntry) => void;
}

export function TeamSchedule({ onAssignJob, onUpdateSchedule }: TeamScheduleProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'team'>('team');

  // Mock team members with realistic Danish data
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Maria Hansen',
      email: 'maria@tekup.dk',
      phone: '23 45 67 89',
      role: 'team_leader',
      skills: ['kontorrenhold', 'privat', 'team_management', 'kvalitetskontrol'],
      availability: 'available',
      location: 'København Centrum',
      vehicle: 'Renault Kangoo (EL85 123)',
      certification: ['Miljøcertifikat', 'Førstehjælp', 'Sikkerhed på arbejdspladsen']
    },
    {
      id: '2',
      name: 'Peter Nielsen',
      email: 'peter@tekup.dk',
      phone: '87 65 43 21',
      role: 'cleaner',
      skills: ['kontorrenhold', 'privat', 'grundig_rengøring'],
      availability: 'busy',
      location: 'Nørrebro',
      certification: ['Miljøcertifikat']
    },
    {
      id: '3',
      name: 'Anna Larsen',
      email: 'anna@tekup.dk',
      phone: '42 18 75 93',
      role: 'cleaner',
      skills: ['privat', 'specialrengøring', 'tæppe_rengøring'],
      availability: 'available',
      location: 'Østerbro',
      certification: ['Miljøcertifikat', 'Tæppe specialistcertifikat']
    },
    {
      id: '4',
      name: 'Lars Kristensen',
      email: 'lars@tekup.dk',
      phone: '56 78 90 12',
      role: 'specialist',
      skills: ['specialrengøring', 'industri', 'farlige_stoffer'],
      availability: 'available',
      location: 'Vesterbro',
      vehicle: 'Ford Transit Connect (BH42 876)',
      certification: ['Miljøcertifikat', 'Kemi specialistcertifikat', 'Højde arbejde']
    },
    {
      id: '5',
      name: 'Mette Sørensen',
      email: 'mette@tekup.dk',
      phone: '78 90 12 34',
      role: 'cleaner',
      skills: ['privat', 'vinduespolering', 'havearbejde'],
      availability: 'off',
      location: 'Frederiksberg',
      certification: ['Miljøcertifikat']
    },
    {
      id: '6',
      name: 'Michael Olsen',
      email: 'michael@tekup.dk',
      phone: '34 56 78 90',
      role: 'specialist',
      skills: ['vinduespolering', 'facade_rengøring', 'højde_arbejde'],
      availability: 'available',
      location: 'Amager',
      certification: ['Miljøcertifikat', 'Højde arbejde', 'Vinduespolering specialist']
    }
  ]);

  // Mock schedule entries with realistic Danish jobs
  const [scheduleEntries] = useState<TeamScheduleEntry[]>([
    {
      id: '1',
      memberId: '1',
      date: new Date(2024, 11, 16),
      startTime: '08:00',
      endTime: '11:00',
      jobId: 'job-1',
      jobTitle: 'Ugentlig kontorrenhold',
      customer: 'Køpenhavns Advokatfirma',
      address: 'Kongens Nytorv 15, 1050 København K',
      jobType: 'kontorrenhold',
      status: 'scheduled'
    },
    {
      id: '2',
      memberId: '2',
      date: new Date(2024, 11, 16),
      startTime: '08:00',
      endTime: '11:00',
      jobId: 'job-1',
      jobTitle: 'Ugentlig kontorrenhold',
      customer: 'Køpenhavns Advokatfirma',
      address: 'Kongens Nytorv 15, 1050 København K',
      jobType: 'kontorrenhold',
      status: 'scheduled'
    },
    {
      id: '3',
      memberId: '3',
      date: new Date(2024, 11, 16),
      startTime: '14:00',
      endTime: '18:00',
      jobId: 'job-2',
      jobTitle: 'Privat hovedrengøring',
      customer: 'Caja og Torben Madsen',
      address: 'Strandvejen 45, 2900 Hellerup',
      jobType: 'privat',
      status: 'in_progress'
    },
    {
      id: '4',
      memberId: '4',
      date: new Date(2024, 11, 17),
      startTime: '06:00',
      endTime: '14:00',
      jobId: 'job-3',
      jobTitle: 'Restaurant dybderengøring',
      customer: 'Restaurant Noma',
      address: 'Refshalevej 96, 1432 København K',
      jobType: 'specialrengøring',
      status: 'scheduled',
      notes: 'Kræver food safety certificering - tag specialudstyr'
    },
    {
      id: '5',
      memberId: '6',
      date: new Date(2024, 11, 18),
      startTime: '09:00',
      endTime: '15:00',
      jobId: 'job-4',
      jobTitle: 'Vinduespolering',
      customer: 'Danske Bank Hovedkontor',
      address: 'Holmens Kanal 2-12, 1092 København K',
      jobType: 'vinduespolering',
      status: 'scheduled',
      notes: 'Høje vinduer - sikkerhedsudstyr påkrævet'
    }
  ]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getScheduleForMemberAndDate = (memberId: string, date: Date) => {
    return scheduleEntries.filter(entry => 
      entry.memberId === memberId && isSameDay(entry.date, date)
    );
  };

  const getAvailabilityColor = (availability: TeamMember['availability']) => {
    switch (availability) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'off': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'team_leader': return 'bg-purple-500 text-white';
      case 'specialist': return 'bg-cyan-500 text-white';
      case 'cleaner': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getJobTypeColor = (type: TeamScheduleEntry['jobType']) => {
    switch (type) {
      case 'kontorrenhold': return 'bg-blue-500/20 text-blue-300 border-blue-500';
      case 'privat': return 'bg-green-500/20 text-green-300 border-green-500';
      case 'specialrengøring': return 'bg-purple-500/20 text-purple-300 border-purple-500';
      case 'vinduespolering': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500';
    }
  };

  const getStatusIcon = (status: TeamScheduleEntry['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Calendar className="w-4 h-4 text-blue-400" />;
    }
  };

  const filteredMembers = filterRole === 'all' ? teamMembers : teamMembers.filter(member => member.role === filterRole);

  const getMemberWorkload = (memberId: string) => {
    const memberEntries = scheduleEntries.filter(entry => entry.memberId === memberId);
    const totalHours = memberEntries.reduce((sum, entry) => {
      const start = new Date(`2024-01-01 ${entry.startTime}`);
      const end = new Date(`2024-01-01 ${entry.endTime}`);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
    return Math.min(100, (totalHours / 40) * 100); // 40 hours = 100%
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Team Skemaer</h2>
          <p className="text-gray-300">
            Administrer og overvåg dit rengøringsteams arbejdsplaner
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Alle roller</option>
            <option value="team_leader">Team ledere</option>
            <option value="specialist">Specialister</option>
            <option value="cleaner">Rengøringsassistenter</option>
          </select>
          
          <div className="flex items-center space-x-1">
            {['team', 'week', 'day'].map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode(mode as typeof viewMode)}
                className={viewMode === mode 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }
              >
                {mode === 'team' ? 'Team' : mode === 'week' ? 'Uge' : 'Dag'}
              </Button>
            ))}
          </div>
          
          <Button className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Tilføj Medarbejder
          </Button>
        </div>
      </div>

      {/* Team Overview */}
      {viewMode === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const workload = getMemberWorkload(member.id);
            const memberSchedule = scheduleEntries.filter(entry => entry.memberId === member.id);
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-white font-semibold">{member.name}</h3>
                          <Badge className={getRoleColor(member.role)} size="sm">
                            {member.role === 'team_leader' ? 'Team Leder' :
                             member.role === 'specialist' ? 'Specialist' : 'Rengøringsassistent'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getAvailabilityColor(member.availability)}`} />
                        <span className="text-xs text-gray-400 capitalize">{member.availability}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-300">
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-300">
                        <Phone className="w-4 h-4" />
                        <span>{member.phone}</span>
                      </div>
                      {member.location && (
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                          <MapPin className="w-4 h-4" />
                          <span>{member.location}</span>
                        </div>
                      )}
                      {member.vehicle && (
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                          <Car className="w-4 h-4" />
                          <span>{member.vehicle}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Workload */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">Arbejdsbyrde denne uge</span>
                        <span className="text-sm text-white font-medium">{Math.round(workload)}%</span>
                      </div>
                      <Progress value={workload} className="h-2" />
                    </div>
                    
                    {/* Skills */}
                    <div>
                      <p className="text-sm text-gray-300 mb-2">Færdigheder</p>
                      <div className="flex flex-wrap gap-1">
                        {member.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs bg-white/10 text-gray-300">
                            {skill.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Upcoming Jobs */}
                    <div>
                      <p className="text-sm text-gray-300 mb-2">Kommende jobs ({memberSchedule.length})</p>
                      {memberSchedule.slice(0, 2).map((entry) => (
                        <div key={entry.id} className={`p-2 rounded border ${getJobTypeColor(entry.jobType)} mb-2`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{entry.jobTitle}</span>
                            {getStatusIcon(entry.status)}
                          </div>
                          <div className="text-xs opacity-80">
                            {format(entry.date, 'dd/MM')} • {entry.startTime}-{entry.endTime}
                          </div>
                          <div className="text-xs opacity-60 mt-1">{entry.customer}</div>
                        </div>
                      ))}
                      {memberSchedule.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                          onClick={() => setSelectedMember(member.id)}
                        >
                          Se alle {memberSchedule.length} jobs
                        </Button>
                      )}
                    </div>
                    
                    {/* Certifications */}
                    {member.certification.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-300 mb-2">Certificeringer</p>
                        <div className="flex flex-wrap gap-1">
                          {member.certification.map((cert) => (
                            <Badge key={cert} className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                              ✓ {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              Uge {format(currentWeek, 'w', { locale: da })} - {format(weekStart, 'MMM yyyy', { locale: da })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-gray-300 p-2 w-32">Medarbejder</th>
                    {weekDays.map((day) => (
                      <th key={day.toISOString()} className="text-center text-gray-300 p-2 min-w-32">
                        <div className="text-xs">{format(day, 'EEE', { locale: da })}</div>
                        <div className="text-lg font-bold">{format(day, 'd')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-t border-white/10">
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-white text-sm font-medium">{member.name}</div>
                            <div className={`w-2 h-2 rounded-full ${getAvailabilityColor(member.availability)} inline-block`} />
                          </div>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const daySchedule = getScheduleForMemberAndDate(member.id, day);
                        return (
                          <td key={day.toISOString()} className="p-1 text-center align-top">
                            <div className="space-y-1">
                              {daySchedule.map((entry) => (
                                <div 
                                  key={entry.id}
                                  className={`p-1 rounded text-xs ${getJobTypeColor(entry.jobType)} cursor-pointer hover:opacity-80 transition-opacity`}
                                  onClick={() => onUpdateSchedule?.(entry)}
                                >
                                  <div className="font-medium">{entry.startTime}</div>
                                  <div className="truncate">{entry.jobTitle}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300">Tilgængelige</p>
                <p className="text-2xl font-bold text-white">
                  {teamMembers.filter(m => m.availability === 'available').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-300">Optaget</p>
                <p className="text-2xl font-bold text-white">
                  {teamMembers.filter(m => m.availability === 'busy').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-300">Fri/Syg</p>
                <p className="text-2xl font-bold text-white">
                  {teamMembers.filter(m => m.availability === 'off').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300">Total timer</p>
                <p className="text-2xl font-bold text-white">
                  {scheduleEntries.reduce((sum, entry) => {
                    const start = new Date(`2024-01-01 ${entry.startTime}`);
                    const end = new Date(`2024-01-01 ${entry.endTime}`);
                    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  }, 0).toFixed(0)}t
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}