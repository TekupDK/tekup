import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, Filter, Search, Clock, User, MapPin } from 'lucide-react';

const Calendar: React.FC = () => {
  // const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const events = [
    {
      id: 1,
      title: 'Renovering - Jes Vestergaard',
      time: '09:00 - 11:30',
      date: '2025-10-21',
      status: 'confirmed',
      customer: 'Jes Vestergaard',
      location: 'København',
      type: 'renovation'
    },
    {
      id: 2,
      title: 'Maling - Maria Hansen',
      time: '13:00 - 15:00',
      date: '2025-10-21',
      status: 'pending',
      customer: 'Maria Hansen',
      location: 'Aarhus',
      type: 'painting'
    },
    {
      id: 3,
      title: 'Gulv - Lars Nielsen',
      time: '16:00 - 18:00',
      date: '2025-10-21',
      status: 'confirmed',
      customer: 'Lars Nielsen',
      location: 'Odense',
      type: 'flooring'
    },
    {
      id: 4,
      title: 'Konsultation - Anna Larsen',
      time: '10:00 - 11:00',
      date: '2025-10-22',
      status: 'confirmed',
      customer: 'Anna Larsen',
      location: 'Aalborg',
      type: 'consultation'
    }
  ];

  const getEventColor = (type: string) => {
    switch (type) {
      case 'renovation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'painting': return 'bg-green-100 text-green-800 border-green-200';
      case 'flooring': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'consultation': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const todayEvents = events.filter(event => event.date === '2025-10-21');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalender</h1>
          <p className="text-gray-600">Administrer dine bookinger og tidsplaner</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Ny booking</span>
          </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              view === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Måned
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              view === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Uge
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              view === 'day' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Dag
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Søg bookinger..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Kalender oversigt</h3>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simple calendar grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date(2025, 9, i - 6); // October 2025
                const isToday = date.toDateString() === new Date().toDateString();
                const hasEvents = events.some(event => event.date === date.toISOString().split('T')[0]);
                
                return (
                  <div
                    key={i}
                    className={`p-2 h-16 border border-gray-200 rounded-lg ${
                      isToday ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isToday ? 'font-bold text-blue-700' : 'text-gray-900'}`}>
                        {date.getDate()}
                      </span>
                      {hasEvents && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Today's Events */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">I dag</h3>
              <p className="text-sm text-gray-600">21. oktober 2025</p>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {todayEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border ${getEventColor(event.type)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{event.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {event.status === 'confirmed' ? 'Bekræftet' : 'Afventer'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{event.customer}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bookinger i dag</span>
                <span className="font-semibold text-gray-900">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bekræftede</span>
                <span className="font-semibold text-green-600">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Afventer</span>
                <span className="font-semibold text-yellow-600">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total tid</span>
                <span className="font-semibold text-gray-900">6.5 timer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
