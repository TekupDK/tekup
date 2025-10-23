'use client';

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Building, 
  Sparkles, 
  Clock, 
  DollarSign, 
  CheckCircle,
  Info,
  Star,
  Users,
  Calendar
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  duration: number; // in minutes
  category: 'residential' | 'commercial' | 'deep_cleaning' | 'maintenance';
  features: string[];
  popularity: number;
  rating: number;
  bookingCount: number;
}

interface ServiceSelectionProps {
  onServiceSelect: (service: Service, options: ServiceOptions) => void;
  selectedService?: Service;
}

interface ServiceOptions {
  frequency: 'one_time' | 'weekly' | 'bi_weekly' | 'monthly';
  addOns: string[];
  specialRequests: string;
}

const SERVICES: Service[] = [
  {
    id: 'standard-residential',
    name: 'Standard Boligrengøring',
    description: 'Grundig rengøring af alle rum inkl. køkken, badeværelse og stue',
    basePrice: 800,
    duration: 180,
    category: 'residential',
    features: ['Støvsugning', 'Gulvvask', 'Badeværelse', 'Køkken', 'Støvtørring'],
    popularity: 95,
    rating: 4.8,
    bookingCount: 1247
  },
  {
    id: 'deep-cleaning',
    name: 'Dybderengøring',
    description: 'Omfattende rengøring inkl. vinduer, ovn, køleskab og skabe',
    basePrice: 1200,
    duration: 300,
    category: 'deep_cleaning',
    features: ['Alt fra standard', 'Vinduer indvendig', 'Ovnrengøring', 'Køleskab', 'Skabe indvendig'],
    popularity: 78,
    rating: 4.9,
    bookingCount: 892
  },
  {
    id: 'office-cleaning',
    name: 'Kontorrengøring',
    description: 'Professionel rengøring af kontorer og erhvervslokaler',
    basePrice: 600,
    duration: 120,
    category: 'commercial',
    features: ['Skriveborde', 'Mødelokaler', 'Køkkenområde', 'Toiletter', 'Fællesarealer'],
    popularity: 65,
    rating: 4.7,
    bookingCount: 543
  },
  {
    id: 'maintenance-cleaning',
    name: 'Vedligeholdelsesrengøring',
    description: 'Hurtig oprydning og vedligeholdelse mellem hovedrengøringer',
    basePrice: 400,
    duration: 90,
    category: 'maintenance',
    features: ['Hurtig støvsugning', 'Overfladerengøring', 'Badeværelse', 'Køkken basis'],
    popularity: 45,
    rating: 4.6,
    bookingCount: 321
  }
];

const ADD_ONS = [
  { id: 'windows-external', name: 'Vinduer udvendig', price: 200, duration: 60 },
  { id: 'carpet-cleaning', name: 'Tæpperengøring', price: 300, duration: 90 },
  { id: 'balcony-cleaning', name: 'Altan/terrasse', price: 150, duration: 45 },
  { id: 'garage-cleaning', name: 'Garage', price: 250, duration: 60 },
  { id: 'basement-cleaning', name: 'Kælder', price: 200, duration: 45 }
];

export const ServiceSelection: React.FC<ServiceSelectionProps> = ({
  onServiceSelect,
  selectedService
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(selectedService?.id || '');
  const [frequency, setFrequency] = useState<ServiceOptions['frequency']>('one_time');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const handleServiceSelect = (service: Service) => {
    setSelectedServiceId(service.id);
    setShowDetails(null);
  };

  const handleContinue = () => {
    const service = SERVICES.find(s => s.id === selectedServiceId);
    if (!service) return;

    const options: ServiceOptions = {
      frequency,
      addOns: selectedAddOns,
      specialRequests
    };

    onServiceSelect(service, options);
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const calculateTotalPrice = () => {
    const service = SERVICES.find(s => s.id === selectedServiceId);
    if (!service) return 0;

    let total = service.basePrice;
    
    // Add-ons
    selectedAddOns.forEach(addOnId => {
      const addOn = ADD_ONS.find(a => a.id === addOnId);
      if (addOn) total += addOn.price;
    });

    // Frequency discount
    const discounts = {
      one_time: 0,
      weekly: 0.15,
      bi_weekly: 0.10,
      monthly: 0.05
    };

    if (frequency !== 'one_time') {
      total = total * (1 - discounts[frequency]);
    }

    return Math.round(total);
  };

  const calculateTotalDuration = () => {
    const service = SERVICES.find(s => s.id === selectedServiceId);
    if (!service) return 0;

    let total = service.duration;
    
    selectedAddOns.forEach(addOnId => {
      const addOn = ADD_ONS.find(a => a.id === addOnId);
      if (addOn) total += addOn.duration;
    });

    return total;
  };

  const getCategoryIcon = (category: Service['category']) => {
    switch (category) {
      case 'residential': return Home;
      case 'commercial': return Building;
      case 'deep_cleaning': return Sparkles;
      case 'maintenance': return Clock;
    }
  };

  const getCategoryColor = (category: Service['category']) => {
    switch (category) {
      case 'residential': return 'bg-blue-100 text-blue-800';
      case 'commercial': return 'bg-purple-100 text-purple-800';
      case 'deep_cleaning': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getFrequencyLabel = (freq: ServiceOptions['frequency']) => {
    switch (freq) {
      case 'one_time': return 'Engangs';
      case 'weekly': return 'Ugentlig';
      case 'bi_weekly': return 'Hver 14. dag';
      case 'monthly': return 'Månedlig';
    }
  };

  const getFrequencyDiscount = (freq: ServiceOptions['frequency']) => {
    switch (freq) {
      case 'weekly': return '15% rabat';
      case 'bi_weekly': return '10% rabat';
      case 'monthly': return '5% rabat';
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vælg din rengøringsservice</h2>
        <p className="text-gray-600">
          Vælg den service der passer bedst til dine behov
        </p>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SERVICES.map((service) => {
          const Icon = getCategoryIcon(service.category);
          const isSelected = selectedServiceId === service.id;
          const isExpanded = showDetails === service.id;

          return (
            <div
              key={service.id}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleServiceSelect(service)}
            >
              {/* Service Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(service.category)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                )}
              </div>

              {/* Service Stats */}
              <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  {service.rating}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {service.bookingCount} bookinger
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {Math.round(service.duration / 60)}t {service.duration % 60}m
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-green-600 mr-1" />
                  <span className="text-xl font-bold text-gray-900">
                    {service.basePrice} kr
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(isExpanded ? null : service.id);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Info className="w-4 h-4 mr-1" />
                  {isExpanded ? 'Skjul detaljer' : 'Se detaljer'}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Inkluderet:</h4>
                  <ul className="space-y-1">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Popularity Badge */}
              {service.popularity > 80 && (
                <div className="mt-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    🔥 Populær valg
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Frequency Selection */}
      {selectedServiceId && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hvor ofte skal vi komme?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['one_time', 'weekly', 'bi_weekly', 'monthly'] as const).map((freq) => {
              const discount = getFrequencyDiscount(freq);
              
              return (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    frequency === freq 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{getFrequencyLabel(freq)}</div>
                  {discount && (
                    <div className="text-sm text-green-600 font-medium mt-1">{discount}</div>
                  )}
                  {freq !== 'one_time' && (
                    <div className="text-xs text-gray-500 mt-1">Automatisk booking</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add-ons */}
      {selectedServiceId && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tilkøb (valgfrit)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ADD_ONS.map((addOn) => (
              <label
                key={addOn.id}
                className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedAddOns.includes(addOn.id)}
                  onChange={() => toggleAddOn(addOn.id)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{addOn.name}</div>
                  <div className="text-sm text-gray-600">
                    +{addOn.price} kr • {addOn.duration} min
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Special Requests */}
      {selectedServiceId && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Særlige ønsker</h3>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Beskriv eventuelle særlige ønsker eller instruktioner..."
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Summary & Continue */}
      {selectedServiceId && (
        <div className="bg-gray-50 border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sammendrag</h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {calculateTotalPrice()} kr
              </div>
              <div className="text-sm text-gray-600">
                Ca. {Math.round(calculateTotalDuration() / 60)}t {calculateTotalDuration() % 60}m
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <div className="flex justify-between">
              <span>Service:</span>
              <span>{SERVICES.find(s => s.id === selectedServiceId)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Frekvens:</span>
              <span>{getFrequencyLabel(frequency)}</span>
            </div>
            {selectedAddOns.length > 0 && (
              <div className="flex justify-between">
                <span>Tilkøb:</span>
                <span>{selectedAddOns.length} valgt</span>
              </div>
            )}
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Fortsæt til booking
          </button>
        </div>
      )}
    </div>
  );
};