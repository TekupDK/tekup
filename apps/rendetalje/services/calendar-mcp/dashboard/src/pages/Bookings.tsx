import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const Bookings: React.FC = () => {
  const bookings = [
    {
      id: 1,
      customer: 'Jes Vestergaard',
      service: 'Renovering',
      date: '2025-10-21',
      time: '09:00 - 11:30',
      status: 'confirmed',
      location: 'København',
      duration: 2.5,
      price: 2500
    },
    {
      id: 2,
      customer: 'Maria Hansen',
      service: 'Maling',
      date: '2025-10-21',
      time: '13:00 - 15:00',
      status: 'pending',
      location: 'Aarhus',
      duration: 2,
      price: 1800
    },
    {
      id: 3,
      customer: 'Lars Nielsen',
      service: 'Gulv',
      date: '2025-10-21',
      time: '16:00 - 18:00',
      status: 'confirmed',
      location: 'Odense',
      duration: 2,
      price: 2200
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookinger</h1>
          <p className="text-gray-600">Administrer alle dine bookinger</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Ny booking
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(booking.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{booking.customer}</h3>
                    <p className="text-sm text-gray-600">{booking.service}</p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{booking.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{booking.price} kr</p>
                    <p className="text-sm text-gray-500">{booking.duration} timer</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status === 'confirmed' ? 'Bekræftet' : 
                     booking.status === 'pending' ? 'Afventer' : 'Annulleret'}
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

export default Bookings;
