import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Star, CheckCircle, Phone, Mail, User, Building2 } from 'lucide-react';

interface BookingFormData {
  customerType: 'residential' | 'commercial';
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  estimatedDuration: number;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
  specialRequirements: string;
}

const initialFormData: BookingFormData = {
  customerType: 'residential',
  name: '',
  email: '',
  phone: '',
  address: '',
  city: 'Aarhus',
  postalCode: '',
  serviceType: 'standard-cleaning',
  preferredDate: '',
  preferredTime: '09:00',
  estimatedDuration: 120,
  frequency: 'one-time',
  specialRequirements: ''
};

const serviceTypes = [
  {
    id: 'standard-cleaning',
    name: 'Standard Rengøring',
    description: 'Almindelig rengøring af hjem eller kontor',
    price: 349,
    duration: 120
  },
  {
    id: 'deep-cleaning',
    name: 'Hovedrengøring',
    description: 'Grundig rengøring af alle områder',
    price: 599,
    duration: 240
  },
  {
    id: 'window-cleaning',
    name: 'Vinduesrengøring',
    description: 'Professionel vinduesrengøring indvendigt og udvendigt',
    price: 299,
    duration: 90
  },
  {
    id: 'office-cleaning',
    name: 'Kontorrengøring',
    description: 'Specialiseret rengøring af kontormiljøer',
    price: 449,
    duration: 180
  },
  {
    id: 'restaurant-cleaning',
    name: 'Restaurant Rengøring',
    description: 'Professionel rengøring af restauranter og køkkener',
    price: 799,
    duration: 300
  }
];

/**
 *
 */
export default function RendetaljeBooking() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<BookingFormData>>({});

  const selectedService = serviceTypes.find(s => s.id === formData.serviceType);
  const totalSteps = 4;

  const updateFormData = (updates: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear related errors
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete newErrors[key as keyof BookingFormData];
    });
    setErrors(newErrors);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<BookingFormData> = {};

    switch (step) {
      case 1:
        if (!formData.serviceType) newErrors.serviceType = 'Vælg en service';
        if (!formData.customerType) newErrors.customerType = 'Vælg kundetype';
        break;
      case 2:
        if (!formData.name.trim()) newErrors.name = 'Navn er påkrævet';
        if (!formData.email.trim()) newErrors.email = 'Email er påkrævet';
        if (!/\\S+@\\S+\\.\\S+/.test(formData.email)) newErrors.email = 'Ugyldig email adresse';
        if (!formData.phone.trim()) newErrors.phone = 'Telefon er påkrævet';
        if (!formData.address.trim()) newErrors.address = 'Adresse er påkrævet';
        if (!formData.postalCode.trim()) newErrors.postalCode = 'Postnummer er påkrævet';
        break;
      case 3:
        if (!formData.preferredDate) newErrors.preferredDate = 'Vælg en dato';
        if (!formData.preferredTime) newErrors.preferredTime = 'Vælg et tidspunkt';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitBooking = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    
    try {
      // Simulate API call to Rendetalje OS backend
      const booking = {
        ...formData,
        estimatedCost: selectedService?.price || 0,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      // In real implementation, this would call the Rendetalje OS API
      console.log('Submitting booking:', booking);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      setCurrentStep(4);
    } catch (error) {
      console.error('Booking submission failed:', error);
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setIsSubmitted(false);
    setErrors({});
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 Booking Modtaget!
            </h2>
            
            <p className="text-lg text-gray-600 mb-6">
              Tak for din booking af <strong>{selectedService?.name}</strong>.
              Vi kontakter dig inden for 2 timer for at bekræfte tiden.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">📋 Booking Detaljer</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dato & Tid:</span>
                  <span className="font-medium">
                    {new Date(formData.preferredDate).toLocaleDateString('da-DK')} kl. {formData.preferredTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Adresse:</span>
                  <span className="font-medium">{formData.address}, {formData.city}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimeret pris:</span>
                  <span className="font-medium text-lg text-blue-600">
                    {selectedService?.price} kr
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book Ny Service
              </button>
              
              <a 
                href="tel:+4571759759"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Phone className="w-4 h-4 mr-2" />
                Ring til os
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold text-xl">🧹</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Rendetalje - Book Professionel Rengøring
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Få din rengøring ordnet af professionelle i Aarhus området
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center mt-4">
            <span className="text-sm text-gray-500">
              Trin {currentStep} af {totalSteps}
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Vælg Service & Kundetype
              </h2>

              {/* Customer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Kundetype
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => updateFormData({ customerType: 'residential' })}
                    className={`p-4 border-2 rounded-lg flex items-center justify-center transition-colors ${
                      formData.customerType === 'residential'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-5 h-5 mr-2" />
                    Privat
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormData({ customerType: 'commercial' })}
                    className={`p-4 border-2 rounded-lg flex items-center justify-center transition-colors ${
                      formData.customerType === 'commercial'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="w-5 h-5 mr-2" />
                    Erhverv
                  </button>
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Vælg Service
                </label>
                <div className="grid gap-4">
                  {serviceTypes.map(service => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => updateFormData({ 
                        serviceType: service.id,
                        estimatedDuration: service.duration 
                      })}
                      className={`p-6 border-2 rounded-lg text-left transition-colors ${
                        formData.serviceType === service.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {service.name}
                        </h3>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-blue-600">
                            {service.price} kr
                          </span>
                          <div className="text-sm text-gray-500">
                            ~{service.duration} min
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600">{service.description}</p>
                    </button>
                  ))}
                </div>
                {errors.serviceType && (
                  <p className="text-red-600 text-sm mt-1">{errors.serviceType}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Kontakt Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fulde Navn *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Dit fulde navn"
                  />
                  {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Adresse *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="din@email.dk"
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefonnummer *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData({ phone: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+45 12 34 56 78"
                  />
                  {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    By
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData({ city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Aarhus"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateFormData({ address: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Eksempel Vej 123, 1. th"
                  />
                  {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postnummer *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateFormData({ postalCode: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.postalCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="8000"
                  />
                  {errors.postalCode && <p className="text-red-600 text-sm mt-1">{errors.postalCode}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Vælg Tid & Hyppighed
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Foretrukken Dato *
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    min={getMinDate()}
                    onChange={(e) => updateFormData({ preferredDate: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.preferredDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.preferredDate && <p className="text-red-600 text-sm mt-1">{errors.preferredDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Foretrukken Tid *
                  </label>
                  <select
                    value={formData.preferredTime}
                    onChange={(e) => updateFormData({ preferredTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hyppighed
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'one-time', label: 'Engangsjob' },
                    { value: 'weekly', label: 'Ugentlig' },
                    { value: 'bi-weekly', label: 'Hver 14. dag' },
                    { value: 'monthly', label: 'Månedlig' }
                  ].map(freq => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => updateFormData({ frequency: freq.value as any })}
                      className={`p-3 border-2 rounded-lg text-sm transition-colors ${
                        formData.frequency === freq.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Særlige Krav (valgfrit)
                </label>
                <textarea
                  value={formData.specialRequirements}
                  onChange={(e) => updateFormData({ specialRequirements: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Beskriv eventuelle særlige krav eller ønsker til rengøringen..."
                />
              </div>

              {/* Price Summary */}
              {selectedService && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">💰 Pris Oversigt</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>{selectedService.name}</span>
                      <span>{selectedService.price} kr</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Estimeret varighed</span>
                      <span>{selectedService.duration} minutter</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-blue-600">{selectedService.price} kr</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    * Priser er vejledende og kan variere baseret på opgavens omfang
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tilbage
              </button>
            )}
            
            <div className="ml-auto">
              {currentStep < 3 ? (
                <button
                  onClick={nextStep}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Næste
                </button>
              ) : (
                <button
                  onClick={submitBooking}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sender...
                    </>
                  ) : (
                    'Send Booking'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Professionelt Team</h3>
            <p className="text-sm text-gray-600">
              Erfarne rengøringsspecialister med dansk arbejdsmoral
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">4.8/5 Stjerner</h3>
            <p className="text-sm text-gray-600">
              Høj kundetilfredshed baseret på hundredvis af anmeldelser
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Aarhus Området</h3>
            <p className="text-sm text-gray-600">
              Vi betjener hele Aarhus og omkringliggende områder
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Har du spørgsmål? Kontakt os direkte
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="tel:+4571759759" 
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Phone className="w-4 h-4 mr-2" />
              +45 71 75 97 59
            </a>
            <a 
              href="mailto:booking@rendetalje.dk" 
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              booking@rendetalje.dk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}