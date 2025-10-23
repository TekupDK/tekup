'use client';

import React, { useState } from 'react';
import { X, Save, User, Mail, Phone, MapPin, Settings, FileText } from 'lucide-react';
import { Customer } from '../../types';
import { api } from '../../lib/api';

interface CustomerFormProps {
  customer?: Customer;
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  preferences: {
    preferred_time?: string;
    special_instructions?: string;
    key_location?: string;
    contact_method?: 'email' | 'phone' | 'sms';
  };
  notes: string;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: {
      street: customer?.address?.street || '',
      city: customer?.address?.city || '',
      postal_code: customer?.address?.postal_code || '',
      country: customer?.address?.country || 'Denmark'
    },
    preferences: {
      preferred_time: customer?.preferences?.preferred_time || '',
      special_instructions: customer?.preferences?.special_instructions || '',
      key_location: customer?.preferences?.key_location || '',
      contact_method: customer?.preferences?.contact_method || 'email'
    },
    notes: customer?.notes || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'preferences' | 'notes'>('basic');

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CustomerFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Navn er påkrævet');
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Ugyldig email adresse');
    }

    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone)) {
      errors.push('Ugyldigt telefonnummer');
    }

    if (!formData.address.street.trim()) {
      errors.push('Gadeadresse er påkrævet');
    }

    if (!formData.address.city.trim()) {
      errors.push('By er påkrævet');
    }

    if (!formData.address.postal_code.trim()) {
      errors.push('Postnummer er påkrævet');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        preferences: Object.fromEntries(
          Object.entries(formData.preferences).filter(([_, value]) => value !== '')
        )
      };

      let response;
      if (customer) {
        response = await api.put(`/customers/${customer.id}`, payload);
      } else {
        response = await api.post('/customers', payload);
      }

      onSave(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Grundlæggende', icon: User },
    { id: 'address', label: 'Adresse', icon: MapPin },
    { id: 'preferences', label: 'Præferencer', icon: Settings },
    { id: 'notes', label: 'Noter', icon: FileText }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {customer ? 'Rediger Kunde' : 'Ny Kunde'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Navn *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Kundens fulde navn"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="kunde@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+45 12 34 56 78"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'address' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gadeadresse *
                  </label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Hovedgade 123"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postnummer *
                    </label>
                    <input
                      type="text"
                      value={formData.address.postal_code}
                      onChange={(e) => handleInputChange('address.postal_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      By *
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="København"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Land
                    </label>
                    <select
                      value={formData.address.country}
                      onChange={(e) => handleInputChange('address.country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Denmark">Danmark</option>
                      <option value="Sweden">Sverige</option>
                      <option value="Norway">Norge</option>
                      <option value="Germany">Tyskland</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foretrukken tid
                    </label>
                    <select
                      value={formData.preferences.preferred_time || ''}
                      onChange={(e) => handleInputChange('preferences.preferred_time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Vælg tid</option>
                      <option value="morning">Morgen (8-12)</option>
                      <option value="afternoon">Eftermiddag (12-16)</option>
                      <option value="evening">Aften (16-20)</option>
                      <option value="flexible">Fleksibel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foretrukken kontaktmetode
                    </label>
                    <select
                      value={formData.preferences.contact_method || 'email'}
                      onChange={(e) => handleInputChange('preferences.contact_method', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Telefon</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nøgle placering
                  </label>
                  <input
                    type="text"
                    value={formData.preferences.key_location || ''}
                    onChange={(e) => handleInputChange('preferences.key_location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Under dørmåtten, i nøgleboks, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Særlige instruktioner
                  </label>
                  <textarea
                    value={formData.preferences.special_instructions || ''}
                    onChange={(e) => handleInputChange('preferences.special_instructions', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Særlige ønsker eller instruktioner for rengøringen..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interne noter
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Interne noter om kunden (ikke synlige for kunden)..."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Disse noter er kun synlige for medarbejdere og vil ikke blive delt med kunden.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {customer ? 'Gem Ændringer' : 'Opret Kunde'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};