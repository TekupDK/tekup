'use client';

import React, { useState } from 'react';
import { ServiceSelection } from '../../components/customer/ServiceSelection';
import { DateTimePicker } from '../../components/customer/DateTimePicker';
import { BookingConfirmation } from '../../components/customer/BookingConfirmation';
import { CustomerNotifications } from '../../components/customer/CustomerNotifications';
import { CustomerMessaging } from '../../components/customer/CustomerMessaging';
import { CustomerReview } from '../../components/customer/CustomerReview';
import { 
  CheckCircle, 
  Calendar, 
  ArrowLeft, 
  Home,
  Clock,
  Star,
  Phone,
  Mail
} from 'lucide-react';

type BookingStep = 'service' | 'datetime' | 'confirmation' | 'success';

interface BookingState {
  service?: any;
  serviceOptions?: any;
  dateTime?: any;
  bookingData?: any;
}

export default function CustomerPage() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [bookingState, setBookingState] = useState<BookingState>({});
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Mock customer data - in real app, get from auth context
  const customer = {
    id: 'cust-1',
    name: 'Lars Nielsen',
    email: 'lars@example.com'
  };

  const handleServiceSelect = (service: any, options: any) => {
    setBookingState(prev => ({
      ...prev,
      service,
      serviceOptions: options
    }));
    setCurrentStep('datetime');
  };

  const handleDateTimeSelect = (dateTime: any) => {
    setBookingState(prev => ({
      ...prev,
      dateTime
    }));
    setCurrentStep('confirmation');
  };

  const handleBookingConfirm = async (bookingData: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock booking ID
      const mockBookingId = 'BK' + Date.now().toString().slice(-6);
      setBookingId(mockBookingId);
      
      setBookingState(prev => ({
        ...prev,
        bookingData
      }));
      
      setCurrentStep('success');
    } catch (error) {
      console.error('Booking failed:', error);
      // Handle error
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'datetime':
        setCurrentStep('service');
        break;
      case 'confirmation':
        setCurrentStep('datetime');
        break;
      default:
        break;
    }
  };

  const handleNewBooking = () => {
    setCurrentStep('service');
    setBookingState({});
    setBookingId(null);
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'service', label: 'Service', icon: Home },
      { id: 'datetime', label: 'Dato & Tid', icon: Calendar },
      { id: 'confirmation', label: 'Bekræftelse', icon: CheckCircle }
    ];

    const stepOrder = ['service', 'datetime', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);

    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;
          const isAccessible = index <= currentIndex;

          return (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                ${isActive 
                  ? 'border-blue-600 bg-blue-600 text-white' 
                  : isCompleted 
                  ? 'border-green-600 bg-green-600 text-white'
                  : isAccessible
                  ? 'border-gray-300 text-gray-600'
                  : 'border-gray-200 text-gray-400'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-4 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderHeader = () => {
    if (currentStep === 'success') {
      return (
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking bekræftet!</h1>
          <p className="text-gray-600">
            Din booking er nu bekræftet og du vil modtage en bekræftelse på email
          </p>
        </div>
      );
    }

    return (
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book rengøring</h1>
        <p className="text-gray-600">
          Book professionel rengøring nemt og hurtigt online
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {currentStep !== 'service' && currentStep !== 'success' && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-lg mr-4"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">RendetaljeOS</h1>
                <p className="text-sm text-gray-600">Kunde Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <CustomerNotifications customerId={customer.id} />
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  <div className="text-xs text-gray-500">Kunde</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderHeader()}

        {currentStep !== 'success' && renderStepIndicator()}

        {currentStep === 'service' && (
          <ServiceSelection
            onServiceSelect={handleServiceSelect}
            selectedService={bookingState.service}
          />
        )}

        {currentStep === 'datetime' && bookingState.service && (
          <DateTimePicker
            onDateTimeSelect={handleDateTimeSelect}
            serviceDuration={bookingState.service.duration}
            selectedDateTime={bookingState.dateTime}
          />
        )}

        {currentStep === 'confirmation' && bookingState.service && bookingState.dateTime && (
          <BookingConfirmation
            service={bookingState.service}
            serviceOptions={bookingState.serviceOptions}
            dateTime={bookingState.dateTime}
            onConfirm={handleBookingConfirm}
            onBack={handleBack}
          />
        )}

        {currentStep === 'success' && (
          <div className="max-w-2xl mx-auto">
            {/* Success Message */}
            <div className="bg-white border rounded-lg p-8 mb-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Booking #{bookingId}
                </h2>
                <p className="text-gray-600">
                  Vi glæder os til at rengøre for dig!
                </p>
              </div>

              {/* Booking Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">{bookingState.service?.name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Dato:</span>
                  <span className="font-medium">
                    {new Date(bookingState.dateTime?.date).toLocaleDateString('da-DK', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Tid:</span>
                  <span className="font-medium">
                    {bookingState.dateTime?.time} - {bookingState.dateTime?.endTime}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Adresse:</span>
                  <span className="font-medium text-right">
                    {bookingState.bookingData?.address.street}<br />
                    {bookingState.bookingData?.address.postalCode} {bookingState.bookingData?.address.city}
                  </span>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Hvad sker der nu?</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Du modtager en bekræftelse på email inden for få minutter</li>
                  <li>• Vi sender en påmindelse 24 timer før</li>
                  <li>• Vores team ankommer til det aftalte tidspunkt</li>
                  <li>• Du kan følge fremskridt og kommunikere via SMS</li>
                </ul>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Har du spørgsmål?</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    <span>+45 12 34 56 78</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    <span>support@rendetalje.dk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleNewBooking}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Book igen
              </button>
              <button
                onClick={() => window.location.href = '/customer/bookings'}
                className="text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-100 font-medium"
              >
                Se mine bookinger
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}