'use client';

import React, { useState } from 'react';

/**
 * Activities page component for managing customer activities and interactions.
 * @returns {React.JSX.Element} The activities page component
 */
export default function Activities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Mock data for activities
  const activities = [
    {
      id: '1',
      subject: 'Call with Alex Johnson',
      type: 'Call',
      contact: 'Alex Johnson',
      company: 'TechCorp',
      scheduledAt: '2023-10-15T10:00:00Z',
      completed: false,
    },
    {
      id: '2',
      subject: 'Send proposal to Innovate Inc',
      type: 'Task',
      contact: 'Sarah Williams',
      company: 'Innovate Inc',
      scheduledAt: '2023-10-15T14:00:00Z',
      completed: false,
    },
    {
      id: '3',
      subject: 'Meeting with Michael Chen',
      type: 'Meeting',
      contact: 'Michael Chen',
      company: 'Startup.io',
      scheduledAt: '2023-10-16T09:30:00Z',
      completed: false,
    },
  ];

  // Activity types for future filter functionality
  // const activityTypes = [
  //   { id: '1', name: 'Call', color: 'bg-blue-500' },
  //   { id: '2', name: 'Meeting', color: 'bg-green-500' },
  //   { id: '3', name: 'Email', color: 'bg-yellow-500' },
  //   { id: '4', name: 'Task', color: 'bg-purple-500' },
  // ];

  const filteredActivities = activities.filter(activity =>
    activity.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">Activities</h1>
          <div className="flex space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search activities..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                onClick={() => setViewMode('list')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                className={`px-3 py-2 ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                onClick={() => setViewMode('calendar')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Activity
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Activity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {activity.contact}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {activity.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {activity.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(activity.scheduledAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3">Edit</a>
                      <a href="#" className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">Delete</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-medium text-gray-900 dark:text-white py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, index) => {
                const day = index - 4; // Adjust for starting day
                const isCurrentMonth = day > 0 && day <= 31;
                const isToday = day === 15; // Mock today as 15th
                
                return (
                  <div 
                    key={index} 
                    className={`min-h-24 p-2 border border-gray-200 dark:border-gray-700 rounded ${
                      isCurrentMonth 
                        ? 'bg-white dark:bg-gray-800' 
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {isCurrentMonth && (
                      <>
                        <div className={`text-sm font-medium ${
                          isToday 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {day}
                        </div>
                        {day === 15 && (
                          <div className="mt-1 space-y-1">
                            <div className="text-xs p-1 bg-blue-100 dark:bg-blue-900 rounded text-blue-800 dark:text-blue-200 truncate">
                              Call with Alex
                            </div>
                          </div>
                        )}
                        {day === 16 && (
                          <div className="mt-1 space-y-1">
                            <div className="text-xs p-1 bg-green-100 dark:bg-green-900 rounded text-green-800 dark:text-green-200 truncate">
                              Meeting with Michael
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}