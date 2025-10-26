'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import { Calendar, Clock, MapPin, Users, RotateCcw, Pause, Play, Edit, Trash2, Plus, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
import { format, addDays, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay, addWeeks, addMonths } from 'date-fns';
import { da } from 'date-fns/locale';

interface RecurringJob {
  id: string;
  title: string;
  customer: string;
  address: string;
  jobType: 'kontorrenhold' | 'privat' | 'specialrengøring' | 'vinduespolering';
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  startDate: Date;
  endDate?: Date;
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  startTime: string;
  duration: number; // minutes
  team: string[];
  price: number;
  status: 'active' | 'paused' | 'cancelled';
  nextOccurrence: Date;
  totalOccurrences: number;
  completedOccurrences: number;
  notes?: string;
  requirements?: string[];
  createdAt: Date;
  lastModified: Date;
}

interface JobOccurrence {
  id: string;
  recurringJobId: string;
  date: Date;
  status: 'scheduled' | 'completed' | 'skipped' | 'cancelled';
  actualDuration?: number;
  actualTeam?: string[];
  customerRating?: number;
  notes?: string;
}

interface RecurringJobsProps {
  onJobEdit?: (job: RecurringJob) => void;
  onJobPause?: (jobId: string) => void;
  onJobResume?: (jobId: string) => void;
  onJobCancel?: (jobId: string) => void;
}

export function RecurringJobs({ onJobEdit, onJobPause, onJobResume, onJobCancel }: RecurringJobsProps) {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFrequency, setFilterFrequency] = useState<string>('all');
  const [showOccurrences, setShowOccurrences] = useState<string | null>(null);

  // Mock recurring jobs with realistic Danish cleaning contracts
  const [recurringJobs] = useState<RecurringJob[]>([
    {
      id: '1',
      title: 'Ugentlig kontorrenhold',
      customer: 'Køpenhavns Advokatfirma',
      address: 'Kongens Nytorv 15, 1050 København K',
      jobType: 'kontorrenhold',
      frequency: 'weekly',
      startDate: new Date(2024, 8, 1), // Started September 1st
      dayOfWeek: 1, // Monday
      startTime: '08:00',
      duration: 180,
      team: ['Maria Hansen', 'Peter Nielsen'],
      price: 2800,
      status: 'active',
      nextOccurrence: new Date(2024, 11, 16), // Next Monday
      totalOccurrences: 52, // 1 year contract
      completedOccurrences: 15,
      notes: 'Standard office cleaning. Extra attention to meeting rooms.',
      requirements: ['Miljøvenlige produkter', 'Støjbegrænsning efter 17:00'],
      createdAt: new Date(2024, 7, 15),
      lastModified: new Date(2024, 11, 10)
    },
    {
      id: '2',
      title: 'Månedlig hovedrengøring',
      customer: 'Nørrebro Tandklinik',
      address: 'Nørrebrogade 66, 2200 København N',
      jobType: 'kontorrenhold',
      frequency: 'monthly',
      startDate: new Date(2024, 6, 15), // Started July 15th
      dayOfWeek: 3, // Wednesday
      startTime: '18:00',
      duration: 240,
      team: ['Anna Larsen', 'Lars Kristensen'],
      price: 4200,
      status: 'active',
      nextOccurrence: new Date(2024, 11, 18), // Next Wednesday
      totalOccurrences: 24, // 2 year contract
      completedOccurrences: 5,
      notes: 'Medical facility - strict hygiene standards required.',
      requirements: ['Medicinske certificeringer', 'Desinfektion', 'Dokumentation'],
      createdAt: new Date(2024, 6, 1),
      lastModified: new Date(2024, 10, 20)
    },
    {
      id: '3',
      title: 'Hver 14. dag privat',
      customer: 'Familie Madsen',
      address: 'Strandvejen 45, 2900 Hellerup',
      jobType: 'privat',
      frequency: 'biweekly',
      startDate: new Date(2024, 9, 5), // Started October 5th
      dayOfWeek: 6, // Saturday
      startTime: '10:00',
      duration: 240,
      team: ['Mette Sørensen'],
      price: 3500,
      status: 'active',
      nextOccurrence: new Date(2024, 11, 21), // Next Saturday
      totalOccurrences: 26, // 1 year contract
      completedOccurrences: 6,
      notes: 'Large family home with pets. Use pet-friendly products.',
      requirements: ['Allergivenlige produkter', 'Hunde i hjemmet'],
      createdAt: new Date(2024, 8, 20),
      lastModified: new Date(2024, 11, 5)
    },
    {
      id: '4',
      title: 'Kvartalvis dybderengøring',
      customer: 'Restaurant Bistro',
      address: 'Vesterbrogade 120, 1620 København V',
      jobType: 'specialrengøring',
      frequency: 'quarterly',
      startDate: new Date(2024, 3, 1), // Started April 1st
      dayOfWeek: 7, // Sunday
      startTime: '06:00',
      duration: 480,
      team: ['Lars Kristensen', 'Michael Olsen', 'Anna Larsen'],
      price: 8500,
      status: 'active',
      nextOccurrence: new Date(2025, 0, 5), // Next January
      totalOccurrences: 8, // 2 year contract
      completedOccurrences: 3,
      notes: 'Deep kitchen cleaning including ventilation system.',
      requirements: ['Food safety certificering', 'Specialudstyr', 'Tidlig start'],
      createdAt: new Date(2024, 2, 15),
      lastModified: new Date(2024, 9, 10)
    },
    {
      id: '5',
      title: 'Ugentlig vinduespolering',
      customer: 'Danske Bank Hovedkontor',
      address: 'Holmens Kanal 2-12, 1092 København K',
      jobType: 'vinduespolering',
      frequency: 'weekly',
      startDate: new Date(2024, 5, 1), // Started June 1st
      dayOfWeek: 4, // Thursday
      startTime: '09:00',
      duration: 360,
      team: ['Michael Olsen', 'Søren Pedersen'],
      price: 6200,
      status: 'paused',
      nextOccurrence: new Date(2024, 11, 19), // Would be next Thursday
      totalOccurrences: 104, // 2 year contract
      completedOccurrences: 28,
      notes: 'Paused during winter season (December-February)',
      requirements: ['Højde certificering', 'Sikkerhedsudstyr', 'Vejrafhængig'],
      createdAt: new Date(2024, 4, 20),
      lastModified: new Date(2024, 10, 30)
    }
  ]);

  // Mock job occurrences for history tracking
  const [jobOccurrences] = useState<JobOccurrence[]>([
    {
      id: '1',
      recurringJobId: '1',
      date: new Date(2024, 11, 9), // Last Monday
      status: 'completed',
      actualDuration: 175,
      actualTeam: ['Maria Hansen', 'Peter Nielsen'],
      customerRating: 5,
      notes: 'Excellent work as always'
    },
    {
      id: '2',
      recurringJobId: '1',
      date: new Date(2024, 11, 2), // Previous Monday
      status: 'completed',
      actualDuration: 185,
      actualTeam: ['Maria Hansen', 'Peter Nielsen'],
      customerRating: 4
    },
    {
      id: '3',
      recurringJobId: '2',
      date: new Date(2024, 10, 20), // Last month
      status: 'completed',
      actualDuration: 250,
      actualTeam: ['Anna Larsen', 'Lars Kristensen'],
      customerRating: 5,
      notes: 'Perfect hygiene standards maintained'
    }
  ]);

  const getJobTypeColor = (type: RecurringJob['jobType']) => {
    switch (type) {
      case 'kontorrenhold': return 'bg-blue-500 text-white';
      case 'privat': return 'bg-green-500 text-white';
      case 'specialrengøring': return 'bg-purple-500 text-white';
      case 'vinduespolering': return 'bg-cyan-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: RecurringJob['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20 border-green-500';
      case 'paused': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500';
      case 'cancelled': return 'text-red-400 bg-red-500/20 border-red-500';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500';
    }
  };

  const getFrequencyText = (frequency: RecurringJob['frequency']) => {
    switch (frequency) {
      case 'weekly': return 'Ugentlig';
      case 'biweekly': return 'Hver 14. dag';
      case 'monthly': return 'Månedlig';
      case 'quarterly': return 'Kvartalsvis';
      default: return frequency;
    }
  };

  const getDayOfWeekText = (dayOfWeek: number) => {
    const days = ['', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
    return days[dayOfWeek];
  };

  const getCompletionPercentage = (job: RecurringJob) => {
    if (job.totalOccurrences === 0) return 0;
    return Math.round((job.completedOccurrences / job.totalOccurrences) * 100);
  };

  const getMonthlyRevenue = (jobs: RecurringJob[]) => {
    return jobs
      .filter(job => job.status === 'active')
      .reduce((sum, job) => {
        switch (job.frequency) {
          case 'weekly': return sum + (job.price * 4.33); // Average weeks per month
          case 'biweekly': return sum + (job.price * 2.17);
          case 'monthly': return sum + job.price;
          case 'quarterly': return sum + (job.price / 3);
          default: return sum;
        }
      }, 0);
  };

  const getJobOccurrences = (jobId: string) => {
    return jobOccurrences.filter(occ => occ.recurringJobId === jobId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const filteredJobs = recurringJobs.filter(job => {
    if (filterStatus !== 'all' && job.status !== filterStatus) return false;
    if (filterFrequency !== 'all' && job.frequency !== filterFrequency) return false;
    return true;
  });

  const activeJobs = recurringJobs.filter(job => job.status === 'active');
  const monthlyRevenue = getMonthlyRevenue(activeJobs);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Tilbagevendende Jobs</h2>
          <p className="text-gray-300">
            Administrer og overvåg dine faste kontrakter og abonnementer
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Alle status</option>
            <option value="active">Aktive</option>
            <option value="paused">Pauseret</option>
            <option value="cancelled">Annulleret</option>
          </select>
          
          <select
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Alle frekvenser</option>
            <option value="weekly">Ugentlig</option>
            <option value="biweekly">Hver 14. dag</option>
            <option value="monthly">Månedlig</option>
            <option value="quarterly">Kvartalsvis</option>
          </select>
          
          <Button className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nyt Abonnement
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300">Aktive kontrakter</p>
                <p className="text-2xl font-bold text-white">{activeJobs.length}</p>
              </div>
              <RotateCcw className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300">Månedlig omsætning</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round(monthlyRevenue).toLocaleString('da-DK')} kr
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300">Gennemførte jobs</p>
                <p className="text-2xl font-bold text-white">
                  {recurringJobs.reduce((sum, job) => sum + job.completedOccurrences, 0)}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-300">Pauserede</p>
                <p className="text-2xl font-bold text-white">
                  {recurringJobs.filter(job => job.status === 'paused').length}
                </p>
              </div>
              <Pause className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recurring Jobs List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => {
          const completionPercentage = getCompletionPercentage(job);
          const recentOccurrences = getJobOccurrences(job.id);
          
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={getJobTypeColor(job.jobType)}>
                          {job.jobType}
                        </Badge>
                        <Badge className={getStatusColor(job.status)} variant="outline">
                          {job.status === 'active' ? '✅ Aktiv' :
                           job.status === 'paused' ? '⏸️ Pauseret' : '❌ Annulleret'}
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                          {getFrequencyText(job.frequency)}
                        </Badge>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-white mb-1">{job.title}</h3>
                      <p className="text-gray-300 mb-2">{job.customer}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2 text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>{job.address}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{getDayOfWeekText(job.dayOfWeek)} kl. {job.startTime}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{job.duration} minutter</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{job.team.join(', ')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-green-400 font-medium">
                          <DollarSign className="w-4 h-4" />
                          <span>{job.price.toLocaleString('da-DK')} kr</span>
                        </div>
                        <div className="flex items-center space-x-2 text-cyan-400">
                          <RotateCcw className="w-4 h-4" />
                          <span>Næste: {format(job.nextOccurrence, 'd/M', { locale: da })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {job.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onJobPause?.(job.id)}
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {job.status === 'paused' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onJobResume?.(job.id)}
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onJobEdit?.(job)}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onJobCancel?.(job.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Kontrakt fremdrift</span>
                      <span className="text-sm text-white font-medium">
                        {job.completedOccurrences} / {job.totalOccurrences} ({completionPercentage}%)
                      </span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                  </div>
                  
                  {/* Contract Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Kontrakt periode</p>
                      <p className="text-white">
                        {format(job.startDate, 'd/M/yyyy', { locale: da })} - 
                        {job.endDate ? format(job.endDate, ' d/M/yyyy', { locale: da }) : ' Løbende'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Senest modificeret</p>
                      <p className="text-white">
                        {format(job.lastModified, 'd/M/yyyy', { locale: da })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Requirements */}
                  {job.requirements && job.requirements.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-300 mb-2">Krav og specifikationer</p>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements.map((req) => (
                          <Badge key={req} variant="secondary" className="bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            ⚠️ {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Notes */}
                  {job.notes && (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded p-3">
                      <p className="text-blue-200 text-sm">
                        <strong>Bemærkninger:</strong> {job.notes}
                      </p>
                    </div>
                  )}
                  
                  {/* Recent Occurrences */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-300">Seneste udførelser</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOccurrences(showOccurrences === job.id ? null : job.id)}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      {showOccurrences === job.id ? 'Skjul' : 'Vis historik'}
                    </Button>
                  </div>
                  
                  {showOccurrences === job.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 mt-4"
                    >
                      {recentOccurrences.length === 0 ? (
                        <p className="text-gray-400 text-sm">Ingen historik endnu</p>
                      ) : (
                        recentOccurrences.slice(0, 3).map((occurrence) => (
                          <div key={occurrence.id} className="bg-white/5 rounded p-3 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">
                                {format(occurrence.date, 'EEEE d. MMMM', { locale: da })}
                              </span>
                              <div className="flex items-center space-x-2">
                                {occurrence.status === 'completed' && (
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                )}
                                {occurrence.customerRating && (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-yellow-400">⭐</span>
                                    <span className="text-sm text-white">{occurrence.customerRating}/5</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {occurrence.actualDuration && (
                              <p className="text-sm text-gray-400">
                                Varighed: {occurrence.actualDuration} min
                                {occurrence.actualDuration !== job.duration && (
                                  <span className={occurrence.actualDuration > job.duration ? 'text-red-400' : 'text-green-400'}>
                                    {' '}({occurrence.actualDuration > job.duration ? '+' : ''}{occurrence.actualDuration - job.duration} min)
                                  </span>
                                )}
                              </p>
                            )}
                            
                            {occurrence.notes && (
                              <p className="text-sm text-blue-300 mt-1">
                                "{occurrence.notes}"
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredJobs.length === 0 && (
        <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
          <CardContent className="p-8 text-center">
            <RotateCcw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Ingen tilbagevendende jobs fundet</h3>
            <p className="text-gray-400 mb-4">
              {filterStatus !== 'all' || filterFrequency !== 'all' 
                ? 'Prøv at justere dine filtre for at se flere jobs'
                : 'Opret dit første abonnement for at komme i gang med faste kontrakter'
              }
            </p>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Opret Abonnement
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}