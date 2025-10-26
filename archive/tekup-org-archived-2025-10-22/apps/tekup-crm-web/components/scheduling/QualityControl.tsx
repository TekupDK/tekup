'use client';

import React, { useState, useRef } from 'react';
import { mockCleaningJobs, mockTeamMembers } from '../../lib/types/mockData';
import { CleaningJob, TeamMember } from '../../lib/types/scheduling';

// Simple SVG icon components
const CameraIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CheckCircleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = ({ className = "h-5 w-5", filled = false }: { className?: string; filled?: boolean }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ClipboardCheckIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const UserIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// Quality control interfaces
interface QualityCheckItem {
  id: string;
  name: string;
  category: 'cleaning' | 'safety' | 'customer' | 'equipment';
  required: boolean;
  completed: boolean;
  notes?: string;
}

interface QualityReport {
  id: string;
  jobId: string;
  inspectorId: string;
  createdAt: Date;
  overallRating: number;
  customerRating?: number;
  checkItems: QualityCheckItem[];
  photos: string[];
  comments: string;
  approved: boolean;
  issues: string[];
  followUpRequired: boolean;
}

const qualityCheckTemplate: QualityCheckItem[] = [
  // Rengøring
  { id: 'floors-clean', name: 'Gulve rengjort og støvsuget', category: 'cleaning', required: true, completed: false },
  { id: 'surfaces-dusted', name: 'Overflader støvet af', category: 'cleaning', required: true, completed: false },
  { id: 'windows-clean', name: 'Vinduer rengjort', category: 'cleaning', required: false, completed: false },
  { id: 'bathroom-clean', name: 'Badeværelse grundigt rengjort', category: 'cleaning', required: true, completed: false },
  { id: 'kitchen-clean', name: 'Køkken rengjort og desinficeret', category: 'cleaning', required: true, completed: false },
  
  // Sikkerhed
  { id: 'safety-check', name: 'Sikkerhedstjek gennemført', category: 'safety', required: true, completed: false },
  { id: 'chemicals-stored', name: 'Kemikalier opbevaret korrekt', category: 'safety', required: true, completed: false },
  { id: 'equipment-checked', name: 'Udstyr kontrolleret og funktionsdygtigt', category: 'safety', required: true, completed: false },
  
  // Kunde
  { id: 'customer-satisfied', name: 'Kunde tilfredshedssamtale', category: 'customer', required: false, completed: false },
  { id: 'special-requests', name: 'Særlige ønsker håndteret', category: 'customer', required: false, completed: false },
  
  // Udstyr
  { id: 'equipment-clean', name: 'Udstyr rengjort efter brug', category: 'equipment', required: true, completed: false },
  { id: 'supplies-restocked', name: 'Forsyninger genopfyldt', category: 'equipment', required: false, completed: false },
];

export default function QualityControl() {
  const [selectedJob, setSelectedJob] = useState<CleaningJob | null>(null);
  const [activeReport, setActiveReport] = useState<QualityReport | null>(null);
  const [checkItems, setCheckItems] = useState<QualityCheckItem[]>(qualityCheckTemplate);
  const [overallRating, setOverallRating] = useState<number>(0);
  const [customerRating, setCustomerRating] = useState<number>(0);
  const [comments, setComments] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [issues, setIssues] = useState<string[]>(['']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completedJobs = mockCleaningJobs.filter(job => job.status === 'completed');

  const handleCheckItemToggle = (itemId: string) => {
    setCheckItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, completed: !item.completed }
        : item
    ));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Mock photo upload - in real app, upload to server
      const newPhotos = Array.from(files).map(file => 
        `mock-photo-${Date.now()}-${file.name}`
      );
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const handleIssueChange = (index: number, value: string) => {
    setIssues(prev => prev.map((issue, i) => i === index ? value : issue));
  };

  const addIssue = () => {
    setIssues(prev => [...prev, '']);
  };

  const removeIssue = (index: number) => {
    setIssues(prev => prev.filter((_, i) => i !== index));
  };

  const calculateCompletionRate = () => {
    const requiredItems = checkItems.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.completed);
    return requiredItems.length > 0 ? (completedRequired.length / requiredItems.length) * 100 : 0;
  };

  const handleSubmitReport = () => {
    if (!selectedJob) return;

    const report: QualityReport = {
      id: `qr-${Date.now()}`,
      jobId: selectedJob.id,
      inspectorId: 'current-user-id',
      createdAt: new Date(),
      overallRating,
      customerRating: customerRating || undefined,
      checkItems: [...checkItems],
      photos: [...photos],
      comments,
      approved: calculateCompletionRate() >= 90 && overallRating >= 4,
      issues: issues.filter(issue => issue.trim() !== ''),
      followUpRequired: issues.some(issue => issue.trim() !== '') || overallRating < 4
    };

    console.log('Kvalitetsrapport indsendt:', report);
    
    // Reset form
    setSelectedJob(null);
    setCheckItems(qualityCheckTemplate);
    setOverallRating(0);
    setCustomerRating(0);
    setComments('');
    setPhotos([]);
    setIssues(['']);
    
    alert('Kvalitetsrapport indsendt med succes!');
  };

  const StarRating = ({ rating, onRatingChange, label }: { 
    rating: number; 
    onRatingChange: (rating: number) => void;
    label: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            <StarIcon className="h-6 w-6" filled={star <= rating} />
          </button>
        ))}
      </div>
    </div>
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cleaning': return '🧽';
      case 'safety': return '⚠️';
      case 'customer': return '👤';
      case 'equipment': return '🛠️';
      default: return '✅';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cleaning': return 'bg-blue-50 border-blue-200';
      case 'safety': return 'bg-red-50 border-red-200';
      case 'customer': return 'bg-green-50 border-green-200';
      case 'equipment': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Kvalitetskontrol
          </h1>
          <p className="text-gray-600">
            Dokumenter og vurder kvaliteten af gennemførte rengøringsjobs
          </p>
        </div>

        {!selectedJob ? (
          /* Job Selection */
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Vælg job til kvalitetskontrol
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedJobs.map((job) => (
                <div 
                  key={job.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">
                      {job.customer.name}
                    </h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Afsluttet
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {job.location.address}
                  </p>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      {new Date(job.scheduledDate).toLocaleDateString('da-DK')}
                    </span>
                    <span className="font-medium text-indigo-600">
                      {job.cost.total.toLocaleString('da-DK')} DKK
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Quality Control Form */
          <div className="space-y-6">
            {/* Job Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Kvalitetskontrol for {selectedJob.customer.name}
                  </h2>
                  <p className="text-gray-600">{selectedJob.location.address}</p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Tilbage til liste
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Jobtype:</span>
                  <p className="font-medium">{selectedJob.jobType}</p>
                </div>
                <div>
                  <span className="text-gray-500">Varighed:</span>
                  <p className="font-medium">{selectedJob.estimatedDuration} min</p>
                </div>
                <div>
                  <span className="text-gray-500">Team:</span>
                  <p className="font-medium">{selectedJob.teamMembers.length} medarbejdere</p>
                </div>
                <div>
                  <span className="text-gray-500">Pris:</span>
                  <p className="font-medium">{selectedJob.cost.total.toLocaleString('da-DK')} DKK</p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Kvalitetstjek progress
                </h3>
                <span className="text-sm text-gray-600">
                  {Math.round(calculateCompletionRate())}% fuldført
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${calculateCompletionRate()}%` }}
                />
              </div>
            </div>

            {/* Check Items by Category */}
            <div className="space-y-4">
              {['cleaning', 'safety', 'customer', 'equipment'].map((category) => {
                const categoryItems = checkItems.filter(item => item.category === category);
                const categoryNames: Record<string, string> = {
                  'cleaning': 'Rengøring',
                  'safety': 'Sikkerhed',
                  'customer': 'Kunde',
                  'equipment': 'Udstyr'
                };

                return (
                  <div key={category} className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${getCategoryColor(category)}`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">{getCategoryIcon(category)}</span>
                      {categoryNames[category]}
                    </h3>
                    
                    <div className="space-y-3">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <button
                              onClick={() => handleCheckItemToggle(item.id)}
                              className={`mr-3 p-1 rounded ${
                                item.completed 
                                  ? 'text-green-600 bg-green-100' 
                                  : 'text-gray-400 bg-gray-100'
                              }`}
                            >
                              {item.completed ? (
                                <CheckCircleIcon className="h-5 w-5" />
                              ) : (
                                <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                              )}
                            </button>
                            <span className={`${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {item.name}
                            </span>
                            {item.required && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Påkrævet
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ratings */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bedømmelser
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StarRating 
                  rating={overallRating}
                  onRatingChange={setOverallRating}
                  label="Samlet kvalitetsvurdering"
                />
                
                <StarRating 
                  rating={customerRating}
                  onRatingChange={setCustomerRating}
                  label="Kundetilfredshed (valgfri)"
                />
              </div>
            </div>

            {/* Photos */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Dokumentation (Fotos)
              </h3>
              
              <div className="space-y-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition-colors"
                >
                  <CameraIcon className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600">Upload fotos</span>
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="bg-gray-100 rounded-lg p-4 text-center">
                        <CameraIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600">Foto {index + 1}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Issues */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Problemer eller bemærkninger
                </h3>
                <button
                  onClick={addIssue}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  + Tilføj problem
                </button>
              </div>
              
              <div className="space-y-3">
                {issues.map((issue, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={issue}
                      onChange={(e) => handleIssueChange(index, e.target.value)}
                      placeholder="Beskriv problem eller bemærkning..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {issues.length > 1 && (
                      <button
                        onClick={() => removeIssue(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Generelle kommentarer
              </h3>
              
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                placeholder="Tilføj generelle kommentarer om jobbet..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <p>Færdiggørelsesgrad: <strong>{Math.round(calculateCompletionRate())}%</strong></p>
                  <p>Samlet bedømmelse: <strong>{overallRating}/5 stjerner</strong></p>
                  {calculateCompletionRate() >= 90 && overallRating >= 4 ? (
                    <p className="text-green-600 font-medium">✅ Godkendt til fakturering</p>
                  ) : (
                    <p className="text-yellow-600 font-medium">⚠️ Kræver opfølgning</p>
                  )}
                </div>
                
                <button
                  onClick={handleSubmitReport}
                  disabled={calculateCompletionRate() < 50}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    calculateCompletionRate() >= 50
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ClipboardCheckIcon className="inline h-5 w-5 mr-2" />
                  Indsend kvalitetsrapport
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}