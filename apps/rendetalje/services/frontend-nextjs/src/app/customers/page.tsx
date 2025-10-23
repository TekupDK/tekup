'use client';

import React, { useState } from 'react';
import { CustomerList } from '../../components/customers/CustomerList';
import { CustomerDetail } from '../../components/customers/CustomerDetail';
import { CustomerForm } from '../../components/customers/CustomerForm';
import { CustomerAnalytics } from '../../components/customers/CustomerAnalytics';
import { Customer } from '../../types';
import { ArrowLeft, BarChart3, Users } from 'lucide-react';

type ViewMode = 'list' | 'detail' | 'form' | 'analytics';

export default function CustomersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewMode('detail');
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setViewMode('form');
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setViewMode('form');
  };

  const handleSaveCustomer = (customer: Customer) => {
    // Refresh the list by going back to list view
    setViewMode('list');
    setEditingCustomer(null);
    setSelectedCustomer(null);
  };

  const handleCloseForm = () => {
    setViewMode('list');
    setEditingCustomer(null);
  };

  const handleBack = () => {
    if (viewMode === 'detail') {
      setViewMode('list');
      setSelectedCustomer(null);
    } else if (viewMode === 'analytics') {
      setViewMode('list');
    }
  };

  const renderHeader = () => {
    switch (viewMode) {
      case 'detail':
        return (
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kunde Detaljer</h1>
              <p className="text-gray-600">Se og administrer kunde information</p>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kunde Analytics</h1>
              <p className="text-gray-600">Indsigt i dine kunder og deres adfærd</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kunder</h1>
              <p className="text-gray-600">Administrer dine kunder og deres information</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('analytics')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
            </div>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RendetaljeOS</h1>
              <p className="text-sm text-gray-600">Kunde Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">EJ</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Ejer</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderHeader()}

        {viewMode === 'list' && (
          <CustomerList
            onSelectCustomer={handleSelectCustomer}
            onCreateCustomer={handleCreateCustomer}
            onEditCustomer={handleEditCustomer}
          />
        )}

        {viewMode === 'detail' && selectedCustomer && (
          <CustomerDetail
            customer={selectedCustomer}
            onBack={handleBack}
            onEdit={handleEditCustomer}
          />
        )}

        {viewMode === 'analytics' && (
          <CustomerAnalytics />
        )}

        {viewMode === 'form' && (
          <CustomerForm
            customer={editingCustomer}
            onClose={handleCloseForm}
            onSave={handleSaveCustomer}
          />
        )}
      </main>
    </div>
  );
}