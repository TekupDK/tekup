'use client';

import React, { useState } from 'react';

// Simple SVG icon components for better compatibility
const CalendarDaysIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = ({ className = "h-5 w-5 text-gray-400" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EnvelopeIcon = ({ className = "h-5 w-5 text-gray-400" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = ({ className = "h-5 w-5 text-gray-400" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const HomeIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const BuildingOfficeIcon = ({ className = "h-5 w-5 text-gray-400" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const MapPinIcon = ({ className = "h-5 w-5 text-gray-400" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const InformationCircleIcon = ({ className = "h-5 w-5 text-blue-600 mt-0.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = ({ className = "h-16 w-16 text-green-600 mx-auto mb-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

import { CleaningJobType, CleaningPreferences, JobLocation } from '../../lib/types/scheduling';

// Danske måneder og ugedage
const DANISH_MONTHS = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December'
];

const DANISH_WEEKDAYS_FULL = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

// Job type konfiguration med danske navne og priser
const JOB_TYPES: Record<CleaningJobType, {
  name: string;
  description: string;
  basePrice: number;
  unit: string;
  duration: number;
  icon: string;
}> = {
  'kontorrenhold': {
    name: 'Kontorrenhold',
    description: 'Professionel rengøring af kontorer, mødelokaler og fællesarealer',
    basePrice: 350,
    unit: 'pr. time',
    duration: 120, // minutter
    icon: '🏢'
  },
  'privatrenhold': {
    name: 'Privatrenhold',
    description: 'Grundig rengøring af private hjem og lejligheder',
    basePrice: 280,
    unit: 'pr. time',
    duration: 180,
    icon: '🏠'
  },
  'flytterenhold': {
    name: 'Flytterenhold',
    description: 'Grundig rengøring ved ind- og udflytning',
    basePrice: 450,
    unit: 'pr. job',
    duration: 240,
    icon: '📦'
  },
  'byggerenhold': {
    name: 'Byggerenhold',
    description: 'Rengøring efter byggeprojekter og renovation',
    basePrice: 400,
    unit: 'pr. time',
    duration: 300,
    icon: '🏗️'
  },
  'vinduespudsning': {
    name: 'Vinduespudsning',
    description: 'Professionel vinduespudsning indvendigt og udvendigt',
    basePrice: 25,
    unit: 'pr. vindue',
    duration: 90,
    icon: '🪟'
  },
  'tæpperens': {
    name: 'Tæpperengøring',
    description: 'Professionel rengøring og pleje af tæpper',
    basePrice: 150,
    unit: 'pr. m²',
    duration: 120,
    icon: '🧽'
  },
  'specialrengøring': {
    name: 'Specialrengøring',
    description: 'Specialiseret rengøring efter behov',
    basePrice: 400,
    unit: 'pr. time',
    duration: 180,
    icon: '⚡'
  },
  'vedligeholdelse': {
    name: 'Vedligeholdelsesrengøring',
    description: 'Løbende vedligeholdelse og mindre reparationer',
    basePrice: 320,
    unit: 'pr. time',
    duration: 150,
    icon: '🔧'
  },
  'dybrengøring': {
    name: 'Dybrengøring',
    description: 'Grundig rengøring med fokus på detaljer',
    basePrice: 380,
    unit: 'pr. time',
    duration: 240,
    icon: '✨'
  },
  'akutrengøring': {
    name: 'Akutrengøring',
    description: 'Hurtig rengøring i akutte situationer',
    basePrice: 500,
    unit: 'pr. time',
    duration: 90,
    icon: '🚨'
  }
};

// Tilgængelige tidspunkter
const AVAILABLE_TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

interface CustomerBookingData {
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  serviceDetails: {
    jobType: CleaningJobType;
    description: string;
    estimatedHours?: number;
    specialRequirements: string[];
  };
  location: JobLocation;
  scheduling: {
    preferredDate: Date | null;
    preferredTime: string;
    recurring: boolean;
    frequency?: 'weekly' | 'biweekly' | 'monthly';
  };
  preferences: CleaningPreferences;
}

interface CustomerSchedulingProps {
  onBookingSubmit?: (booking: CustomerBookingData) => void;
  className?: string;
}

export default function CustomerScheduling({
  onBookingSubmit,
  className = ''
}: CustomerSchedulingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<CustomerBookingData>({
    customerInfo: {
      name: '',
      email: '',
      phone: '',
      company: ''
    },
    serviceDetails: {
      jobType: 'privatrenhold',
      description: '',
      specialRequirements: []
    },
    location: {
      address: '',
      city: '',
      postalCode: '',
      accessInstructions: '',
      parkingInstructions: ''
    },
    scheduling: {
      preferredDate: null,
      preferredTime: '09:00',
      recurring: false
    },
    preferences: {
      preferredTime: 'morning',
      accessMethod: 'key',
      specialInstructions: [],
      fragrance: 'light',
      environmentalPreferences: 'standard'
    }
  });

  const steps = [
    { number: 1, title: 'Service', description: 'Vælg din service' },
    { number: 2, title: 'Detaljer', description: 'Kontaktoplysninger' },
    { number: 3, title: 'Adresse', description: 'Hvor skal vi komme' },
    { number: 4, title: 'Tidspunkt', description: 'Hvornår passer det' },
    { number: 5, title: 'Præferencer', description: 'Særlige ønsker' },
    { number: 6, title: 'Bekræftelse', description: 'Gennemgå booking' }
  ];

  // Generer tilgængelige datoer (næste 30 dage, ekskl. søndage)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip søndage (0) og helligdage
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  const availableDates = generateAvailableDates();

  // Beregn estimeret pris
  const calculateEstimatedPrice = () => {
    const jobType = JOB_TYPES[bookingData.serviceDetails.jobType];
    const hours = bookingData.serviceDetails.estimatedHours || (jobType.duration / 60);
    
    if (jobType.unit === 'pr. time') {
      return jobType.basePrice * hours;
    }
    return jobType.basePrice;
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onBookingSubmit?.(bookingData);
    console.log('Booking submitted:', bookingData);
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = DANISH_MONTHS[date.getMonth()];
    const weekday = DANISH_WEEKDAYS_FULL[date.getDay()];
    return `${weekday} ${day}. ${month}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Book Rengøringsservice</h2>
            <p className="text-gray-600 mt-1">Få et tilbud på under 2 minutter</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Trin {currentStep} af {steps.length}</div>
            <div className="text-lg font-semibold text-blue-600">
              {steps[currentStep - 1].title}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step.number <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {step.number <= currentStep ? (
                    step.number < currentStep ? '✓' : step.number
                  ) : step.number}
                </div>
                {step.number < steps.length && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${step.number < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <ServiceSelectionStep 
            bookingData={bookingData}
            setBookingData={setBookingData}
          />
        )}

        {/* Step 2: Customer Details */}
        {currentStep === 2 && (
          <CustomerDetailsStep 
            bookingData={bookingData}
            setBookingData={setBookingData}
          />
        )}

        {/* Step 3: Location */}
        {currentStep === 3 && (
          <LocationStep 
            bookingData={bookingData}
            setBookingData={setBookingData}
          />
        )}

        {/* Step 4: Scheduling */}
        {currentStep === 4 && (
          <SchedulingStep 
            bookingData={bookingData}
            setBookingData={setBookingData}
            availableDates={availableDates}
          />
        )}

        {/* Step 5: Preferences */}
        {currentStep === 5 && (
          <PreferencesStep 
            bookingData={bookingData}
            setBookingData={setBookingData}
          />
        )}

        {/* Step 6: Confirmation */}
        {currentStep === 6 && (
          <ConfirmationStep 
            bookingData={bookingData}
            estimatedPrice={calculateEstimatedPrice()}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className={`
            px-4 py-2 rounded-lg font-medium
            ${currentStep === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
        >
          Tilbage
        </button>

        <div className="text-center">
          <div className="text-sm text-gray-500">Estimeret pris</div>
          <div className="text-lg font-bold text-green-600">
            {calculateEstimatedPrice().toLocaleString('da-DK')} DKK
          </div>
        </div>

        {currentStep < steps.length ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Næste
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Book Nu
          </button>
        )}
      </div>
    </div>
  );
}

// Step Components
function ServiceSelectionStep({ 
  bookingData, 
  setBookingData 
}: { 
  bookingData: CustomerBookingData;
  setBookingData: (data: CustomerBookingData) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Hvilken service har du brug for?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(JOB_TYPES).map(([key, jobType]) => (
            <div
              key={key}
              onClick={() => setBookingData({
                ...bookingData,
                serviceDetails: {
                  ...bookingData.serviceDetails,
                  jobType: key as CleaningJobType
                }
              })}
              className={`
                p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
                ${bookingData.serviceDetails.jobType === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{jobType.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{jobType.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{jobType.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-green-600">
                      Fra {jobType.basePrice} DKK {jobType.unit}
                    </span>
                    <span className="text-xs text-gray-500">
                      ~{Math.round(jobType.duration / 60)} timer
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Beskriv dine behov (valgfrit)
        </label>
        <textarea
          value={bookingData.serviceDetails.description}
          onChange={(e) => setBookingData({
            ...bookingData,
            serviceDetails: {
              ...bookingData.serviceDetails,
              description: e.target.value
            }
          })}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="F.eks. ekstra snavset køkken, kæledyr i hjemmet, særlige ønsker..."
        />
      </div>
    </div>
  );
}

function CustomerDetailsStep({ 
  bookingData, 
  setBookingData 
}: { 
  bookingData: CustomerBookingData;
  setBookingData: (data: CustomerBookingData) => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Dine kontaktoplysninger
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fulde navn *
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={bookingData.customerInfo.name}
              onChange={(e) => setBookingData({
                ...bookingData,
                customerInfo: {
                  ...bookingData.customerInfo,
                  name: e.target.value
                }
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dit fulde navn"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email adresse *
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={bookingData.customerInfo.email}
              onChange={(e) => setBookingData({
                ...bookingData,
                customerInfo: {
                  ...bookingData.customerInfo,
                  email: e.target.value
                }
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="din@email.dk"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefonnummer *
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={bookingData.customerInfo.phone}
              onChange={(e) => setBookingData({
                ...bookingData,
                customerInfo: {
                  ...bookingData.customerInfo,
                  phone: e.target.value
                }
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+45 12 34 56 78"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Virksomhed (valgfrit)
          </label>
          <div className="relative">
            <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={bookingData.customerInfo.company}
              onChange={(e) => setBookingData({
                ...bookingData,
                customerInfo: {
                  ...bookingData.customerInfo,
                  company: e.target.value
                }
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Virksomhedsnavn"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Hvorfor har vi brug for dine oplysninger?</p>
            <p className="mt-1">
              Vi bruger dine kontaktoplysninger til at bekræfte bookingen og koordinere servicen. 
              Dine oplysninger behandles i henhold til GDPR og deles aldrig med tredjeparter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationStep({ 
  bookingData, 
  setBookingData 
}: { 
  bookingData: CustomerBookingData;
  setBookingData: (data: CustomerBookingData) => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Hvor skal vi udføre servicen?
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresse *
          </label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={bookingData.location.address}
              onChange={(e) => setBookingData({
                ...bookingData,
                location: {
                  ...bookingData.location,
                  address: e.target.value
                }
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Vejnavn og husnummer"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Postnummer *
          </label>
          <input
            type="text"
            value={bookingData.location.postalCode}
            onChange={(e) => setBookingData({
              ...bookingData,
              location: {
                ...bookingData.location,
                postalCode: e.target.value
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="2000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            By *
          </label>
          <input
            type="text"
            value={bookingData.location.city}
            onChange={(e) => setBookingData({
              ...bookingData,
              location: {
                ...bookingData.location,
                city: e.target.value
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="København"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Etage/lejlighed (valgfrit)
          </label>
          <input
            type="text"
            value={bookingData.location.apartmentNumber}
            onChange={(e) => setBookingData({
              ...bookingData,
              location: {
                ...bookingData.location,
                apartmentNumber: e.target.value
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="2. th, lejl. 4"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Byggekode (valgfrit)
          </label>
          <input
            type="text"
            value={bookingData.location.buildingCode}
            onChange={(e) => setBookingData({
              ...bookingData,
              location: {
                ...bookingData.location,
                buildingCode: e.target.value
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1234"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adgangsinstruktioner
        </label>
        <textarea
          value={bookingData.location.accessInstructions}
          onChange={(e) => setBookingData({
            ...bookingData,
            location: {
              ...bookingData.location,
              accessInstructions: e.target.value
            }
          })}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="F.eks. nøgle under måtten, porttelefon, særlige instruktioner..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Parkeringsinstruktioner (valgfrit)
        </label>
        <textarea
          value={bookingData.location.parkingInstructions}
          onChange={(e) => setBookingData({
            ...bookingData,
            location: {
              ...bookingData.location,
              parkingInstructions: e.target.value
            }
          })}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="F.eks. besøgsparkering i gård, parkometetr, etc..."
        />
      </div>
    </div>
  );
}

function SchedulingStep({ 
  bookingData, 
  setBookingData,
  availableDates
}: { 
  bookingData: CustomerBookingData;
  setBookingData: (data: CustomerBookingData) => void;
  availableDates: Date[];
}) {
  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = DANISH_MONTHS[date.getMonth()];
    const weekday = DANISH_WEEKDAYS_FULL[date.getDay()];
    return `${weekday} ${day}. ${month}`;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Hvornår passer det dig bedst?
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Vælg dato *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableDates.slice(0, 12).map((date) => (
            <button
              key={date.toISOString()}
              onClick={() => setBookingData({
                ...bookingData,
                scheduling: {
                  ...bookingData.scheduling,
                  preferredDate: date
                }
              })}
              className={`
                p-3 text-sm rounded-lg border-2 transition-all hover:shadow-sm
                ${bookingData.scheduling.preferredDate?.toDateString() === date.toDateString()
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="font-medium">{formatDate(date)}</div>
              <div className="text-xs text-gray-500">{date.getDate()}/{date.getMonth() + 1}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Vælg tidspunkt *
        </label>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {AVAILABLE_TIMES.map((time) => (
            <button
              key={time}
              onClick={() => setBookingData({
                ...bookingData,
                scheduling: {
                  ...bookingData.scheduling,
                  preferredTime: time
                }
              })}
              className={`
                p-2 text-sm rounded-lg border-2 transition-all hover:shadow-sm
                ${bookingData.scheduling.preferredTime === time
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="recurring"
            checked={bookingData.scheduling.recurring}
            onChange={(e) => setBookingData({
              ...bookingData,
              scheduling: {
                ...bookingData.scheduling,
                recurring: e.target.checked
              }
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
            Jeg vil have tilbagevendende service
          </label>
        </div>

        {bookingData.scheduling.recurring && (
          <div className="mt-4 ml-7">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hvor ofte?
            </label>
            <select
              value={bookingData.scheduling.frequency}
              onChange={(e) => setBookingData({
                ...bookingData,
                scheduling: {
                  ...bookingData.scheduling,
                  frequency: e.target.value as 'weekly' | 'biweekly' | 'monthly'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="weekly">Ugentlig</option>
              <option value="biweekly">Hver 2. uge</option>
              <option value="monthly">Månedlig</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

function PreferencesStep({ 
  bookingData, 
  setBookingData 
}: { 
  bookingData: CustomerBookingData;
  setBookingData: (data: CustomerBookingData) => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Dine præferencer og særlige ønsker
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Adgangsmetode
          </label>
          <div className="space-y-2">
            {[
              { value: 'key', label: 'Jeg har nøgle' },
              { value: 'present', label: 'Jeg er til stede' },
              { value: 'keybox', label: 'Nøgleboks' },
              { value: 'doorman', label: 'Portner/reception' }
            ].map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={option.value}
                  name="accessMethod"
                  value={option.value}
                  checked={bookingData.preferences.accessMethod === option.value}
                  onChange={(e) => setBookingData({
                    ...bookingData,
                    preferences: {
                      ...bookingData.preferences,
                      accessMethod: e.target.value as any
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={option.value} className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Duftpræferencer
          </label>
          <div className="space-y-2">
            {[
              { value: 'none', label: 'Ingen duft' },
              { value: 'light', label: 'Let duft' },
              { value: 'strong', label: 'Kraftig duft' }
            ].map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`fragrance-${option.value}`}
                  name="fragrance"
                  value={option.value}
                  checked={bookingData.preferences.fragrance === option.value}
                  onChange={(e) => setBookingData({
                    ...bookingData,
                    preferences: {
                      ...bookingData.preferences,
                      fragrance: e.target.value as any
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={`fragrance-${option.value}`} className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Miljøvenlige produkter
          </label>
          <div className="space-y-2">
            {[
              { value: 'standard', label: 'Standard produkter' },
              { value: 'eco', label: 'Miljøvenlige produkter' },
              { value: 'organic', label: 'Kun økologiske produkter' }
            ].map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`env-${option.value}`}
                  name="environmental"
                  value={option.value}
                  checked={bookingData.preferences.environmentalPreferences === option.value}
                  onChange={(e) => setBookingData({
                    ...bookingData,
                    preferences: {
                      ...bookingData.preferences,
                      environmentalPreferences: e.target.value as any
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={`env-${option.value}`} className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Særlige instruktioner (allergier, kæledyr, etc.)
        </label>
        <textarea
          value={bookingData.preferences.specialInstructions?.join('\n') || ''}
          onChange={(e) => setBookingData({
            ...bookingData,
            preferences: {
              ...bookingData.preferences,
              specialInstructions: e.target.value.split('\n').filter(line => line.trim())
            }
          })}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="F.eks. allergi overfor bestemte produkter, kæledyr i hjemmet, genstande der ikke må flyttes..."
        />
      </div>
    </div>
  );
}

function ConfirmationStep({ 
  bookingData, 
  estimatedPrice 
}: { 
  bookingData: CustomerBookingData;
  estimatedPrice: number;
}) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Ikke valgt';
    const day = date.getDate();
    const month = DANISH_MONTHS[date.getMonth()];
    const weekday = DANISH_WEEKDAYS_FULL[date.getDay()];
    return `${weekday} ${day}. ${month}`;
  };

  const selectedJobType = JOB_TYPES[bookingData.serviceDetails.jobType];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">
          Bekræft din booking
        </h3>
        <p className="text-gray-600 mt-2">
          Gennemgå alle detaljer før du bekræfter
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        {/* Service */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl mr-3">{selectedJobType.icon}</span>
            <span className="font-medium text-gray-900">{selectedJobType.name}</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            {estimatedPrice.toLocaleString('da-DK')} DKK
          </span>
        </div>

        {/* Date & Time */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Dato og tid:</span>
            <span className="font-medium">
              {formatDate(bookingData.scheduling.preferredDate)} kl. {bookingData.scheduling.preferredTime}
            </span>
          </div>
          {bookingData.scheduling.recurring && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-600">Gentages:</span>
              <span className="font-medium">
                {bookingData.scheduling.frequency === 'weekly' && 'Ugentlig'}
                {bookingData.scheduling.frequency === 'biweekly' && 'Hver 2. uge'}
                {bookingData.scheduling.frequency === 'monthly' && 'Månedlig'}
              </span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Adresse:</span>
            <span className="font-medium text-right">
              {bookingData.location.address}<br />
              {bookingData.location.postalCode} {bookingData.location.city}
            </span>
          </div>
        </div>

        {/* Contact */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Kontakt:</span>
            <span className="font-medium text-right">
              {bookingData.customerInfo.name}<br />
              {bookingData.customerInfo.phone}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Hvad sker der nu?</p>
            <ul className="mt-1 space-y-1">
              <li>• Du modtager en bekræftelse på email inden for 2 timer</li>
              <li>• Vi kontakter dig 24 timer før for at bekræfte</li>
              <li>• Betaling sker efter udført arbejde</li>
              <li>• 100% tilfredshedsgaranti</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}