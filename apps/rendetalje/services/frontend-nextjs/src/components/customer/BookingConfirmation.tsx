'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  CreditCard,
  Home,
  AlertCircle,
  Edit,
  Loader2
} from 'lucide-react';

interface BookingConfirmationProps {
  service: any;
  serviceOptions: any;
  dateTime: any;
  onConfirm: (bookingData: BookingData) => void;
  onBack: () => void;
}

interface BookingData {
  customerInfo: CustomerInfo;
  address: Address;
  paymentMethod: 'card' | 'invoice' | 'mobilepay';
  specialInstructions: string;
  marketingConsent: boolean;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface Address {
  street: string;
  city: string;
  postalCode: string;
  floor?: string;
  door?: string;
  accessInstructions?: string;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  service,
  serviceOptions,
  dateTime,
  onConfirm,
  onBack
}) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: ''
  });

  const [address, setAddress] = useState<Address>({
    street: '',
    city: '',
    postalCode: '',
    floor: '',
    door: '',
    accessInstructions: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'invoice' | 'mobilepay'>('card');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Customer info validation
    if (!customerInfo.name.trim()) {
      newErrors.name = 'Navn er påkrævet';
    }
    if (!customerInfo.email.trim()) {
      newErrors.email = 'Email er påkrævet';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = 'Ugyldig email adresse';
    }
    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'Telefonnummer er påkrævet';
    }

    // Address validation
    if (!address.street.trim()) {
      newErrors.street = 'Adresse er påkrævet';
    }
    if (!address.city.trim()) {
      newErrors.city = 'By er påkrævet';
    }
    if (!address.postalCode.trim()) {
      newErrors.postalCode = 'Postnummer er påkrævet';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData: BookingData = {
        customerInfo,
        address,
        paymentMethod,
        specialInstructions,
        marketingConsent
      };

      await onConfirm(bookingData);
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    let total = service.basePrice;
    
    // Add-ons
    serviceOptions.addOns.forEach((addOnId: string) => {
      const addOn = [
        { id: 'windows-external', price: 200 },
        { id: 'carpet-cleaning', price: 300 },
        { id: 'balcony-cleaning', price: 150 },
        { id: 'garage-cleaning', price: 250 },
        { id: 'basement-cleaning', price: 200 }
      ].find(a => a.id === addOnId);
      if (addOn) total += addOn.price;
    });

    // Frequency discount
    const discounts = {
      one_time: 0,
      weekly: 0.15,
      bi_weekly: 0.10,
      monthly: 0.05
    };

    if (serviceOptions.frequency !== 'one_time') {
      total = total * (1 - discounts[serviceOptions.frequency as keyof typeof discounts]);
    }

    return Math.round(total);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('da-DK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'one_time': return 'Engangs';
      case 'weekly': return 'Ugentlig';
      case 'bi_weekly': return 'Hver 14. dag';
      case 'monthly': return 'Månedlig';
      default: return freq;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bekræft din booking</h2>
        <p className="text-gray-600">
          Gennemgå og bekræft dine oplysninger
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Kontaktoplysninger
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fulde navn *
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Dit fulde navn"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="din@email.dk"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefonnummer *
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+45 12 34 56 78"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Home className="w-5 h-5 mr-2" />
              Rengøringsadresse
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gadeadresse *
                </label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.street ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Hovedgade 123"
                />
                {errors.street && (
                  <p className="mt-1 text-sm text-red-600">{errors.street}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postnummer *
                  </label>
                  <input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => setAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.postalCode ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="1000"
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    By *
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.city ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="København"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etage (valgfrit)
                  </label>
                  <input
                    type="text"
                    value={address.floor}
                    onChange={(e) => setAddress(prev => ({ ...prev, floor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2. sal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dør (valgfrit)
                  </label>
                  <input
                    type="text"
                    value={address.door}
                    onChange={(e) => setAddress(prev => ({ ...prev, door: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="th"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adgangsinstruktioner
                </label>
                <textarea
                  value={address.accessInstructions}
                  onChange={(e) => setAddress(prev => ({ ...prev, accessInstructions: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nøgle under dørmåtten, porttelefon kode 1234, etc."
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Betalingsmetode
            </h3>
            
            <div className="space-y-3">
              {[
                { id: 'card', label: 'Betalingskort', description: 'Visa, Mastercard, Dankort' },
                { id: 'mobilepay', label: 'MobilePay', description: 'Betal med MobilePay' },
                { id: 'invoice', label: 'Faktura', description: 'Modtag faktura på email (14 dages betalingsfrist)' }
              ].map((method) => (
                <label
                  key={method.id}
                  className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{method.label}</div>
                    <div className="text-sm text-gray-600">{method.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Særlige ønsker eller instruktioner
            </h3>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Beskriv eventuelle særlige ønsker, allergier, kæledyr, eller andre vigtige oplysninger..."
            />
          </div>

          {/* Marketing Consent */}
          <div className="bg-white border rounded-lg p-6">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-1 mr-3"
              />
              <div className="text-sm text-gray-600">
                Jeg ønsker at modtage tilbud og nyheder fra Rendetalje på email. 
                Du kan til enhver tid afmelde dig igen.
              </div>
            </label>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking oversigt</h3>
            
            {/* Service Details */}
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-medium text-gray-900">{service.name}</h4>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(dateTime.date)}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                {dateTime.time} - {dateTime.endTime}
              </div>

              <div className="text-sm text-gray-600">
                <strong>Frekvens:</strong> {getFrequencyLabel(serviceOptions.frequency)}
              </div>

              {serviceOptions.addOns.length > 0 && (
                <div className="text-sm text-gray-600">
                  <strong>Tilkøb:</strong>
                  <ul className="mt-1 ml-4">
                    {serviceOptions.addOns.map((addOnId: string) => {
                      const addOn = [
                        { id: 'windows-external', name: 'Vinduer udvendig', price: 200 },
                        { id: 'carpet-cleaning', name: 'Tæpperengøring', price: 300 },
                        { id: 'balcony-cleaning', name: 'Altan/terrasse', price: 150 },
                        { id: 'garage-cleaning', name: 'Garage', price: 250 },
                        { id: 'basement-cleaning', name: 'Kælder', price: 200 }
                      ].find(a => a.id === addOnId);
                      return addOn ? (
                        <li key={addOnId} className="flex justify-between">
                          <span>• {addOn.name}</span>
                          <span>+{addOn.price} kr</span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Grundpris:</span>
                <span>{service.basePrice} kr</span>
              </div>
              
              {serviceOptions.addOns.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tilkøb:</span>
                  <span>
                    +{serviceOptions.addOns.reduce((sum: number, addOnId: string) => {
                      const addOn = [
                        { id: 'windows-external', price: 200 },
                        { id: 'carpet-cleaning', price: 300 },
                        { id: 'balcony-cleaning', price: 150 },
                        { id: 'garage-cleaning', price: 250 },
                        { id: 'basement-cleaning', price: 200 }
                      ].find(a => a.id === addOnId);
                      return sum + (addOn?.price || 0);
                    }, 0)} kr
                  </span>
                </div>
              )}

              {serviceOptions.frequency !== 'one_time' && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Rabat ({getFrequencyLabel(serviceOptions.frequency)}):</span>
                  <span>
                    -{Math.round((service.basePrice + serviceOptions.addOns.reduce((sum: number, addOnId: string) => {
                      const addOn = [
                        { id: 'windows-external', price: 200 },
                        { id: 'carpet-cleaning', price: 300 },
                        { id: 'balcony-cleaning', price: 150 },
                        { id: 'garage-cleaning', price: 250 },
                        { id: 'basement-cleaning', price: 200 }
                      ].find(a => a.id === addOnId);
                      return sum + (addOn?.price || 0);
                    }, 0)) * (serviceOptions.frequency === 'weekly' ? 0.15 : serviceOptions.frequency === 'bi_weekly' ? 0.10 : 0.05))} kr
                  </span>
                </div>
              )}

              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>{calculateTotal()} kr</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Bekræfter booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Bekræft booking
                  </>
                )}
              </button>

              <button
                onClick={onBack}
                disabled={isSubmitting}
                className="w-full text-gray-600 py-2 px-6 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Tilbage
              </button>
            </div>

            {/* Terms */}
            <div className="mt-4 text-xs text-gray-500">
              Ved at bekræfte accepterer du vores{' '}
              <a href="#" className="text-blue-600 hover:underline">handelsbetingelser</a>
              {' '}og{' '}
              <a href="#" className="text-blue-600 hover:underline">privatlivspolitik</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};