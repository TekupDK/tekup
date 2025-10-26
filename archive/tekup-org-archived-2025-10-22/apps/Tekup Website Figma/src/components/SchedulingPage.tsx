'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { JobCalendar } from './scheduling/JobCalendar';
import { RouteOptimization } from './scheduling/RouteOptimization';
import { TeamSchedule } from './scheduling/TeamSchedule';
import { CustomerScheduling } from './scheduling/CustomerScheduling';
import { RecurringJobs } from './scheduling/RecurringJobs';
import { useAuth } from '../hooks/useAuth';
import { Calendar, Route, Users, Clock, RotateCcw, UserCheck, ArrowLeft } from 'lucide-react';

interface SchedulingPageProps {
  onNavigateBack?: () => void;
}

export function SchedulingPage({ onNavigateBack }: SchedulingPageProps) {
  const [activeTab, setActiveTab] = useState('calendar');
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Show authentication required if not logged in
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-white">Login påkrævet</h2>
          <p className="text-gray-300 mb-6">Du skal logge ind for at se scheduling</p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
          >
            Gå til forside
          </Button>
        </div>
      </div>
    );
  }

  const handleJobClick = (jobId: string) => {
    console.log('Job clicked:', jobId);
    // TODO: Implement job detail view or edit modal
  };

  const handleBookingConfirm = (booking: any) => {
    console.log('Booking confirmed:', booking);
    // TODO: Implement booking confirmation logic
  };

  const handleBookingDecline = (bookingId: string) => {
    console.log('Booking declined:', bookingId);
    // TODO: Implement booking decline logic
  };

  const handleJobEdit = (job: any) => {
    console.log('Edit job:', job);
    // TODO: Implement job edit modal
  };

  const handleJobPause = (jobId: string) => {
    console.log('Pause job:', jobId);
    // TODO: Implement job pause logic
  };

  const handleJobResume = (jobId: string) => {
    console.log('Resume job:', jobId);
    // TODO: Implement job resume logic
  };

  const handleJobCancel = (jobId: string) => {
    console.log('Cancel job:', jobId);
    // TODO: Implement job cancel logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-tekup-primary)_0%,_transparent_50%)] opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-tekup-accent)_0%,_transparent_50%)] opacity-10" />
      
      {/* Floating orbs */}
      <motion.div 
        className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full opacity-40 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-white/10 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo & Back */}
              <div className="flex items-center space-x-4">
                {onNavigateBack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateBack}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Tilbage
                  </Button>
                )}
                
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Tekup Scheduling</h1>
                  <p className="text-sm text-gray-400">{user.company}</p>
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden md:block">
                  <div className="font-medium text-white">{user.name}</div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                📅 Planlægning & Scheduling
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Administrer dine rengøringsjobs, optimer ruter og koordiner dit team 
                med avancerede scheduling-værktøjer designet til rengøringsbranchen
              </p>
            </div>
          </motion.div>

          {/* Scheduling Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8 bg-white/10 backdrop-blur-xl border border-white/20">
                <TabsTrigger 
                  value="calendar" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Kalender</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="routes" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                >
                  <Route className="w-4 h-4" />
                  <span className="hidden sm:inline">Ruter</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="team" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Team</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="bookings" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Booking</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="recurring" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Abonnementer</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="mt-0">
                <JobCalendar 
                  onJobClick={handleJobClick}
                  onNewJob={() => console.log('New job')}
                />
              </TabsContent>

              <TabsContent value="routes" className="mt-0">
                <RouteOptimization 
                  onSaveRoute={(route) => console.log('Save route:', route)}
                />
              </TabsContent>

              <TabsContent value="team" className="mt-0">
                <TeamSchedule 
                  onAssignJob={(memberId, jobId) => console.log('Assign job:', memberId, jobId)}
                  onUpdateSchedule={(entry) => console.log('Update schedule:', entry)}
                />
              </TabsContent>

              <TabsContent value="bookings" className="mt-0">
                <CustomerScheduling 
                  onBookingConfirm={handleBookingConfirm}
                  onBookingDecline={handleBookingDecline}
                />
              </TabsContent>

              <TabsContent value="recurring" className="mt-0">
                <RecurringJobs 
                  onJobEdit={handleJobEdit}
                  onJobPause={handleJobPause}
                  onJobResume={handleJobResume}
                  onJobCancel={handleJobCancel}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>
    </div>
  );
}