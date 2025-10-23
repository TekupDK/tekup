'use client';

import React, { useState } from 'react';
import { DailyJobList } from '../../components/employee/DailyJobList';
import { PhotoDocumentation } from '../../components/employee/PhotoDocumentation';
import { CustomerSignature } from '../../components/employee/CustomerSignature';
import { TimeTracker } from '../../components/employee/TimeTracker';
import { TimeEntryCorrection } from '../../components/employee/TimeEntryCorrection';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Camera, 
  FileText,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';

type ViewMode = 'jobs' | 'photo' | 'signature' | 'time' | 'corrections';

export default function EmployeePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock employee data - in real app, get from auth context
  const employee = {
    id: 'emp-1',
    name: 'Maria Hansen',
    role: 'Rengøringsassistent'
  };

  // Update time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handlePhotoDocumentation = (jobId: string) => {
    setSelectedJobId(jobId);
    setViewMode('photo');
  };

  const handleSignatureCapture = (jobId: string) => {
    setSelectedJobId(jobId);
    setViewMode('signature');
  };

  const handleBackToJobs = () => {
    setViewMode('jobs');
    setSelectedJobId(null);
  };

  const renderHeader = () => {
    switch (viewMode) {
      case 'photo':
        return (
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToJobs}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Foto Dokumentation</h1>
              <p className="text-gray-600">Tag billeder af arbejdet</p>
            </div>
          </div>
        );
      case 'signature':
        return (
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToJobs}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kunde Underskrift</h1>
              <p className="text-gray-600">Få kundens underskrift</p>
            </div>
          </div>
        );
      case 'time':
        return (
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToJobs}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tidsregistrering</h1>
              <p className="text-gray-600">Spor din arbejdstid</p>
            </div>
          </div>
        );
      case 'corrections':
        return (
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToJobs}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tidsrettelser</h1>
              <p className="text-gray-600">Ret fejl i tidsregistreringer</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Medarbejder Portal</h1>
              <p className="text-gray-600">Velkommen tilbage, {employee.name}</p>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={() => setViewMode('jobs')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'jobs' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Jobs
              </button>
              <button
                onClick={() => setViewMode('time')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'time' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tid
              </button>
              <button
                onClick={() => setViewMode('corrections')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'corrections' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Rettelser
              </button>
            </nav>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {renderHeader()}
            
            <div className="flex items-center space-x-4">
              {/* Current Time */}
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                {currentTime.toLocaleTimeString('da-DK', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              
              {/* Employee Info */}
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                  <div className="text-xs text-gray-500">{employee.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'jobs' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Dagens Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">6</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Fuldført</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center">
                  <Play className="w-8 h-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">I Gang</p>
                    <p className="text-2xl font-bold text-gray-900">1</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Timer I dag</p>
                    <p className="text-2xl font-bold text-gray-900">6.5</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Job List */}
            <div className="bg-white rounded-lg border">
              <div className="p-6">
                <DailyJobList 
                  employeeId={employee.id}
                  date={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </>
        )}

        {viewMode === 'photo' && selectedJobId && (
          <div className="bg-white rounded-lg border">
            <div className="p-6">
              <PhotoDocumentation
                jobId={selectedJobId}
                photos={[]} // In real app, fetch from API
                onPhotosUpdate={(photos) => {
                  console.log('Photos updated:', photos);
                  // In real app, save to API
                }}
                requiredPhotos={['before', 'after']}
              />
            </div>
          </div>
        )}

        {viewMode === 'signature' && selectedJobId && (
          <div className="max-w-2xl mx-auto">
            <CustomerSignature
              customerName="Test Kunde" // In real app, get from job data
              jobId={selectedJobId}
              onSignatureCapture={(signatureData, customerInfo) => {
                console.log('Signature captured:', { signatureData, customerInfo });
                // In real app, save to API and mark job as completed
                handleBackToJobs();
              }}
              onCancel={handleBackToJobs}
            />
          </div>
        )}

        {viewMode === 'time' && (
          <div className="bg-white rounded-lg border">
            <div className="p-6">
              <TimeTracker
                employeeId={employee.id}
                jobId={selectedJobId || undefined}
                onTimeUpdate={(timeEntry) => {
                  console.log('Time entry updated:', timeEntry);
                }}
              />
            </div>
          </div>
        )}

        {viewMode === 'corrections' && (
          <div className="bg-white rounded-lg border">
            <div className="p-6">
              <TimeEntryCorrection
                employeeId={employee.id}
                onCorrectionSubmitted={(correction) => {
                  console.log('Correction submitted:', correction);
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Quick Action Buttons */}
      {viewMode === 'jobs' && (
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <button
            onClick={() => handlePhotoDocumentation('mock-job-id')}
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            title="Tag billeder"
          >
            <Camera className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => handleSignatureCapture('mock-job-id')}
            className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors"
            title="Få underskrift"
          >
            <FileText className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}