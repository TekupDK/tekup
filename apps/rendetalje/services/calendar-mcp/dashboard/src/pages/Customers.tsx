import React from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, Star } from 'lucide-react';

const Customers: React.FC = () => {
  const customers = [
    {
      id: 1,
      name: 'Jes Vestergaard',
      email: 'jes@example.com',
      phone: '+45 12 34 56 78',
      location: 'København',
      rating: 4.8,
      totalBookings: 12,
      lastBooking: '2025-10-15',
      totalSpent: 28500,
      status: 'active'
    },
    {
      id: 2,
      name: 'Maria Hansen',
      email: 'maria@example.com',
      phone: '+45 23 45 67 89',
      location: 'Aarhus',
      rating: 4.5,
      totalBookings: 8,
      lastBooking: '2025-10-18',
      totalSpent: 15600,
      status: 'active'
    },
    {
      id: 3,
      name: 'Lars Nielsen',
      email: 'lars@example.com',
      phone: '+45 34 56 78 90',
      location: 'Odense',
      rating: 4.9,
      totalBookings: 15,
      lastBooking: '2025-10-20',
      totalSpent: 32000,
      status: 'vip'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kunder</h1>
          <p className="text-gray-600">Administrer dine kunder og deres information</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Ny kunde
          </button>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            {customers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{customer.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{customer.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold">{customer.rating}</span>
                    </div>
                    <p className="text-sm text-gray-500">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{customer.totalBookings}</p>
                    <p className="text-sm text-gray-500">Bookinger</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{customer.totalSpent.toLocaleString()} kr</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(customer.status)}`}>
                    {customer.status === 'vip' ? 'VIP' : 
                     customer.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
